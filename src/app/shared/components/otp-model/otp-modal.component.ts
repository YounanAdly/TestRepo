
import { A11yModule } from '@angular/cdk/a11y';
import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChildren,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button.component';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [TranslateModule, ButtonComponent, A11yModule],
  templateUrl: './otp-modal.component.html',
  styleUrl: './otp-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpModalComponent implements AfterViewChecked {
  readonly isOpen = input(false);
  readonly otpLength = input(4);
  readonly maskedMobileNumber = input('+968 xxxxxxxx');
  readonly otpIllustrationSrc = input('assets/images/otp-illustration.svg');
  readonly closeIconSrc = input('assets/images/close-icon.svg');
  /** ISO 8601 UTC timestamp when the current OTP expires. `null` hides the timer. */
  readonly expiresAtUtc = input<string | Date | null>(null);
  /** True while a verify / resend round-trip is in flight — disables buttons. */
  readonly submitting = input(false);
  /** ngx-translate key for an inline error (wrong code, expired, locked). `null` hides the message. */
  readonly errorKey = input<string | null>(null);

  readonly closed = output<void>();
  readonly verified = output<string>();
  readonly resend = output<void>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly otpInputRefs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  /** Seconds remaining until the OTP expires (0 when expired or no expiry set). */
  readonly remainingSeconds = signal(0);
  /** `MM:SS` formatted countdown for the template. */
  readonly remainingDisplay = computed(() => {
    const total = this.remainingSeconds();
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  otpDigits: string[] = Array(this.otpLength()).fill('');

  private didFocusOnOpen = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** Tracks the last expiry we reset the digits for, to avoid wiping mid-typing. */
  private lastExpiryHandled: string | null = null;

  constructor() {
    // Drive the countdown from the `expiresAtUtc` input. Effect re-runs whenever
    // the parent rotates the expiry (e.g. after a successful resend).
    effect(() => {
      const expiry = this.expiresAtUtc();
      this.stopCountdown();
      if (!expiry || !isPlatformBrowser(this.platformId)) {
        this.remainingSeconds.set(0);
        return;
      }
      const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);
      if (Number.isNaN(expiryDate.getTime())) {
        this.remainingSeconds.set(0);
        return;
      }
      this.tickFrom(expiryDate);
      this.intervalId = setInterval(() => this.tickFrom(expiryDate), 1000);
    });

    this.destroyRef.onDestroy(() => this.stopCountdown());
  }

  ngAfterViewChecked(): void {
    const isOpen = this.isOpen();
    if (isOpen && !this.didFocusOnOpen) {
      this.didFocusOnOpen = true;
      this.focusOtpInput(0);
    }

    if (!isOpen && this.didFocusOnOpen) {
      this.didFocusOnOpen = false;
      this.resetOtpDigits();
      this.lastExpiryHandled = null;
    }

    if (this.otpDigits.length !== this.otpLength()) {
      this.resetOtpDigits();
    }

    // When the parent rotates the expiry (resend), wipe the previous code and
    // refocus digit 0 so the user types fresh values.
    const currentExpiry = this.normalizeExpiry(this.expiresAtUtc());
    if (isOpen && currentExpiry && currentExpiry !== this.lastExpiryHandled) {
      if (this.lastExpiryHandled !== null) {
        this.resetOtpDigits();
        this.focusOtpInput(0);
      }
      this.lastExpiryHandled = currentExpiry;
    }
  }

  get isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => /^\d$/.test(digit));
  }

  trackByOtpIndex(index: number): number {
    return index;
  }

  onClose(): void {
    this.closed.emit();
  }

  onResend(): void {
    if (this.remainingSeconds() > 0 || this.submitting()) {
      return;
    }
    this.resend.emit();
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const normalizedValue = input.value.replace(/\D/g, '').slice(-1);

    this.otpDigits[index] = normalizedValue;
    input.value = normalizedValue;

    if (normalizedValue && index < this.otpLength() - 1) {
      setTimeout(() => this.focusOtpInput(index + 1), 0);
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.focusOtpInput(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.otpLength() - 1) {
      event.preventDefault();
      this.focusOtpInput(index + 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedDigits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, this.otpLength()) || '';

    for (let i = 0; i < this.otpLength(); i += 1) {
      this.otpDigits[i] = pastedDigits[i] || '';
    }

    const nextIndex = Math.min(pastedDigits.length, this.otpLength() - 1);
    this.focusOtpInput(nextIndex);
  }

  onVerify(): void {
    if (!this.isOtpComplete || this.submitting()) {
      return;
    }

    this.verified.emit(this.otpDigits.join(''));
  }

  private resetOtpDigits(): void {
    this.otpDigits = Array(this.otpLength()).fill('');
  }

  private focusOtpInput(index: number): void {
    setTimeout(() => {
      const inputElement = this.otpInputRefs()?.at(index)?.nativeElement;
      if (!inputElement) {
        return;
      }

      inputElement.focus();
      inputElement.select();
    }, 0);
  }

  private tickFrom(expiry: Date): void {
    const remainingMs = expiry.getTime() - Date.now();
    const seconds = Math.max(0, Math.floor(remainingMs / 1000));
    this.remainingSeconds.set(seconds);
    if (seconds === 0) {
      this.stopCountdown();
    }
  }

  private stopCountdown(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private normalizeExpiry(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
}
