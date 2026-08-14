import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, TimeoutError } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button.component';
import { OtpModalComponent } from '../../shared/components/otp-model/otp-modal.component';
import { AuthApiService } from '../../shared/services/auth/auth-api.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import formConfig from './form.json';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, TranslateModule, ButtonComponent, OtpModalComponent, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly bgImage = 'assets/images/bgImage.png';
  readonly logoCard = 'assets/images/logoCard.svg';
  readonly logoNav = 'assets/images/logoNav.svg';
  readonly otpLength = 4;

  readonly loginForm = new FormGroup({});
  readonly loginModel: { mobileNumber: string } = {
    mobileNumber: '',
  };

  readonly isOtpModalOpen = signal(false);
  readonly expiresAtUtc = signal<string | null>(null);
  readonly otpErrorKey = signal<string | null>(null);
  readonly submittingPhone = signal(false);
  readonly submittingOtp = signal(false);
  /** Server-side masked phone (e.g. `+968 xxxx8226`) — falls back to the local mask while pending. */
  readonly serverMaskedPhone = signal<string | null>(null);
  readonly displayMaskedPhone = computed(
    () => this.serverMaskedPhone() ?? this.localMaskedMobileNumber(),
  );

  private returnUrl: string | null = null;

  readonly loginFields: FormlyFieldConfig[] = formConfig as unknown as FormlyFieldConfig[];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.returnUrl = this.readReturnUrl();
    if (this.authService.isAuthenticated()) {
      const lang = this.route.snapshot.paramMap.get('lang') || 'en';
      this.router.navigateByUrl(this.returnUrl ?? `/${lang}/dashboard`);
      return;
    }
    // Pre-fill the phone if the user came from the create-account flow.
    const stateRecord = window.history.state as { phone?: string } | null;
    const incomingPhone = stateRecord?.phone;
    if (incomingPhone && /^\d{8}$/.test(incomingPhone)) {
      this.loginModel.mobileNumber = incomingPhone;
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.submittingPhone()) {
      return;
    }
    const phone = (this.loginModel.mobileNumber || '').trim();
    if (!phone) {
      return;
    }

    this.submittingPhone.set(true);
    this.otpErrorKey.set(null);
    this.authApi.requestLoginOtp({ phone }).pipe(
      finalize(() => this.submittingPhone.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (envelope) => {
        if (!envelope.isSuccess || !envelope.result) {
          this.toast.error('errors.serverTitle', 'errors.serverDetail', envelope);
          return;
        }
        const { expiresAtUtc, maskedPhone, devCode } = envelope.result;
        this.expiresAtUtc.set(expiresAtUtc);
        this.serverMaskedPhone.set(maskedPhone || null);
        this.authService.logDevCode(devCode);
        this.isOtpModalOpen.set(true);
      },
      error: (err) => this.handleRequestOtpError(err),
    });
  }

  onCreateAccount(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const lang = this.route.snapshot.paramMap.get('lang') || 'en';
    this.router.navigateByUrl(`/${lang}/create-account`);
  }

  closeOtpModal(): void {
    this.isOtpModalOpen.set(false);
    this.otpErrorKey.set(null);
  }

  verifyOtp(code: string): void {
    const phone = this.currentPhone();
    if (!phone || this.submittingOtp()) {
      return;
    }
    this.submittingOtp.set(true);
    this.otpErrorKey.set(null);
    this.authApi.verifyOtp({ phone, code }).pipe(
      finalize(() => this.submittingOtp.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (envelope) => {
        if (!envelope.isSuccess || !envelope.result) {
          this.otpErrorKey.set('login.otp.errors.wrongCode');
          return;
        }
        this.authService.setSession(envelope.result);
        this.isOtpModalOpen.set(false);

        const lang = this.route.snapshot.paramMap.get('lang') || 'en';
        this.router.navigateByUrl(`/${lang}/select-account`, {
          state: this.returnUrl ? { returnUrl: this.returnUrl } : {},
        });
      },
      error: (err) => this.handleVerifyOtpError(err),
    });
  }

  resendOtp(): void {
    const phone = this.currentPhone();
    if (!phone || this.submittingOtp()) {
      return;
    }
    this.submittingOtp.set(true);
    this.otpErrorKey.set(null);
    this.authApi.resendOtp({ phone }).pipe(
      finalize(() => this.submittingOtp.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (envelope) => {
        if (!envelope.isSuccess || !envelope.result) {
          this.toast.error('errors.serverTitle', 'errors.serverDetail', envelope);
          return;
        }
        const { expiresAtUtc, devCode, maskedPhone } = envelope.result;
        this.expiresAtUtc.set(expiresAtUtc);
        if (maskedPhone) {
          this.serverMaskedPhone.set(maskedPhone);
        }
        this.authService.logDevCode(devCode);
      },
      error: (err) => this.handleResendOtpError(err),
    });
  }

  private localMaskedMobileNumber(): string {
    const digits = (this.loginModel.mobileNumber || '').replace(/\D/g, '');
    if (!digits) {
      return '+968 xxxxxxxx';
    }
    const visiblePart = digits.slice(-4);
    const hiddenPart = 'x'.repeat(Math.max(digits.length - visiblePart.length, 0));
    return `+968 ${hiddenPart}${visiblePart}`;
  }

  private currentPhone(): string | null {
    const phone = (this.loginModel.mobileNumber || '').trim();
    return phone || null;
  }

  private handleRequestOtpError(err: unknown): void {
    if (err instanceof TimeoutError) {
      this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail');
      return;
    }
    if (!(err instanceof HttpErrorResponse)) {
      return;
    }
    switch (err.status) {
      // Per the API guide the server should return 404 for an unknown phone,
      // but the live API returns 400 with body code 4041. Treat both as the
      // same "not registered" case and let the server's localized message win.
      case 400:
      case 404:
        this.toast.error('login.errors.notRegisteredTitle', 'login.errors.notRegisteredDetail', err);
        break;
      case 408:
        this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail', err);
        break;
      case 429:
        this.toast.warn('errors.rateLimitTitle', 'errors.rateLimitDetail', err);
        break;
      // 0 / 401 / 403 / 5xx already handled by error.interceptor.
      default:
        break;
    }
  }

  private handleVerifyOtpError(err: unknown): void {
    if (err instanceof TimeoutError) {
      this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail');
      return;
    }
    if (!(err instanceof HttpErrorResponse)) {
      return;
    }
    if (err.status === 400) {
      const reason = this.extractReason(err);
      if (reason === 'expired') {
        this.otpErrorKey.set('login.otp.errors.expired');
      } else if (reason === 'locked') {
        this.otpErrorKey.set('login.otp.errors.locked');
        // Close the modal after a brief moment so the user can read the message.
        setTimeout(() => this.closeOtpModal(), 2500);
      } else {
        this.otpErrorKey.set('login.otp.errors.wrongCode');
      }
      return;
    }
    if (err.status === 409) {
      this.toast.error('errors.conflictTitle', 'errors.conflictDetail', err);
      return;
    }
    if (err.status === 429) {
      this.toast.warn('errors.rateLimitTitle', 'errors.rateLimitDetail', err);
    }
  }

  private handleResendOtpError(err: unknown): void {
    if (err instanceof TimeoutError) {
      this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail');
      return;
    }
    if (!(err instanceof HttpErrorResponse)) {
      return;
    }
    if (err.status === 429) {
      this.toast.warn('login.otp.errors.resendLimitTitle', 'login.otp.errors.resendLimitDetail', err);
      this.closeOtpModal();
    }
  }

  /**
   * Best-effort categorization of an OTP 400 response. The API guide documents
   * "Wrong / Expired / Locked" as three distinct outcomes but does not pin down
   * a stable field name, so we look at common message shapes.
   */
  private extractReason(err: HttpErrorResponse): 'wrong' | 'expired' | 'locked' | 'unknown' {
    const body = err.error;
    const candidate: string | undefined =
      typeof body === 'string'
        ? body
        : (body?.errorMessageEn || body?.message || body?.error || '');
    const normalized = String(candidate || '').toLowerCase();
    if (normalized.includes('lock')) return 'locked';
    if (normalized.includes('expir')) return 'expired';
    if (normalized.includes('wrong') || normalized.includes('invalid') || normalized.includes('incorrect')) return 'wrong';
    return 'unknown';
  }

  private readReturnUrl(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const state = window.history.state as { returnUrl?: string } | null;
    const candidate = state?.returnUrl;
    return candidate && candidate.startsWith('/') ? candidate : null;
  }
}
