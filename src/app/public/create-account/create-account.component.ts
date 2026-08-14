
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ButtonComponent } from '../../shared/components/button.component';
import { DropdownOption } from '../../shared/formly/custom-components/drop-down/dropdown.model';
import { OtpModalComponent } from '../../shared/components/otp-model/otp-modal.component';
import { SuccessAlertModalComponent } from '../../shared/components/success-alert/success-alert-modal.component';
import { AuthApiService } from '../../shared/services/auth/auth-api.service';
import { RegisterVerifyPayload } from '../../shared/services/auth/auth.types';
import { AuthService } from '../../shared/services/auth.service';
import { FormlyService } from '../../shared/services/formly.service';
import { LookupApi } from '../../shared/services/lookup/lookup-api.service';
import { LookupEntityOption } from '../../shared/services/lookup/lookup.types';
import { SeoService } from '../../shared/services/seo.service';
import { ToastService } from '../../shared/services/toast.service';
import formConfig from './form.json';

/** Index in form.json where company-specific fields start (section-header + 2 fieldGroups).
 *  Layout: 0=select-account-type header, 1=account-type-toggle, 2=applicant-details header,
 *  3–9=applicant field groups (now includes governorate), 10=company-details header, 11+=company field groups. */
const COMPANY_FIELDS_START = 10;

@Component({
    selector: 'app-create-account',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    FormlyModule,
    TranslateModule,
    RouterModule,
    ButtonComponent,
    OtpModalComponent,
    SuccessAlertModalComponent,
    NgOptimizedImage
],
    templateUrl: './create-account.component.html',
    styleUrl: './create-account.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountComponent implements OnInit, AfterViewInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly seo = inject(SeoService);
    private readonly authApi = inject(AuthApiService);
    private readonly authService = inject(AuthService);
    private readonly formlyService = inject(FormlyService);
    private readonly lookupApi = inject(LookupApi);
    private readonly toast = inject(ToastService);
    private readonly translate = inject(TranslateService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly wilayaLookupResource = this.lookupApi.entityLookup(() => {
        const govId = this.selectedGovernorateId();
        if (!govId) return null;
        return {
            entityName: 'ntw_alwilaya',
            columns: 'ntw_alwilayaid:id,ntw_name:name',
            filters: `ntw_governorates eq '${govId}'`,
        };
    });

    private readonly governorateLookupResource = this.lookupApi.entityLookup(() => ({
        entityName: 'ntw_governorates',
        columns: 'ntw_governoratesid:id,ntw_name:name',
    }));

    readonly bgImage = 'assets/images/bgImage.png';
    readonly logoCard = 'assets/images/logoCard.svg';
    readonly logoNav = 'assets/images/logoNav.svg';
    readonly otpLength = 4;

    readonly isOrganization = signal(false);
    readonly selectedGovernorateId = signal<string | null>(null);

    readonly createAccountForm = new FormGroup({});
    readonly companyForm = new FormGroup({});
    readonly formlyOptions: FormlyFormOptions = {};
    /** Form.valid is a plain property — bridge statusChanges to a signal so computed() reacts. */
    private readonly baseStatus = toSignal(this.createAccountForm.statusChanges, {
        initialValue: this.createAccountForm.status,
    });
    private readonly companyStatus = toSignal(this.companyForm.statusChanges, {
        initialValue: this.companyForm.status,
    });
    /** Combined validity: base fields always checked; company fields only when org is selected. */
    readonly isFormValid = computed(() => {
        const baseValid = this.baseStatus() === 'VALID';
        if (!this.isOrganization()) {
            return baseValid;
        }
        return baseValid && this.companyStatus() === 'VALID';
    });
    /** Personal fields only (account-type toggle + applicant details). */
    readonly baseFields: FormlyFieldConfig[] = (formConfig as unknown as FormlyFieldConfig[]).slice(0, COMPANY_FIELDS_START);
    /** Company-only fields shown via @if — kept separate so Angular @if owns visibility. */
    readonly companyFields: FormlyFieldConfig[] = (formConfig as unknown as FormlyFieldConfig[]).slice(COMPANY_FIELDS_START);
    readonly createAccountModel: {
        accountType: 'personal' | 'organization';
        firstName: string;
        lastName: string;
        civilId: string;
        emailAddress: string;
        governorateId: string;
        wilaya: string;
        address: string;
        phone: string;
        companyName: string;
        crNumber: string;
        companyPhone: string;
        companyAddress: string;
    } = {
        accountType: 'personal',
        firstName: '',
        lastName: '',
        civilId: '',
        emailAddress: '',
        governorateId: '',
        wilaya: '',
        address: '',
        phone: '',
        companyName: '',
        crNumber: '',
        companyPhone: '',
        companyAddress: '',
    };

    readonly isOtpModalOpen = signal(false);
    readonly isSuccessModalOpen = signal(false);
    readonly expiresAtUtc = signal<string | null>(null);
    readonly otpErrorKey = signal<string | null>(null);
    readonly submittingForm = signal(false);
    readonly submittingOtp = signal(false);
    readonly serverMaskedPhone = signal<string | null>(null);
    readonly displayMaskedPhone = computed(
        () => this.serverMaskedPhone() ?? this.localMaskedMobileNumber(),
    );

    constructor() {
        effect(() => {
            const govOptions = this.mapLookupOptions(this.governorateLookupResource.value()?.result);
            this.formlyService.setDropdownValue(this.baseFields, 'governorateId', govOptions);
        });
        effect(() => {
            const options = this.mapLookupOptions(this.wilayaLookupResource.value()?.result);
            this.formlyService.setDropdownValue(this.baseFields, 'wilaya', options);
        });
    }

    ngOnInit(): void {
        this.setSeo();
        this.translate.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.setSeo();
                this.governorateLookupResource.reload();
                this.wilayaLookupResource.reload();
            });
    }

    onSubmit(): void {
        if (!this.isFormValid()) {
            this.createAccountForm.markAllAsTouched();
            if (this.isOrganization()) {
                this.companyForm.markAllAsTouched();
            }
            return;
        }
        if (this.submittingForm()) {
            return;
        }

        const phone = this.createAccountModel.phone.trim();
        const civilId = this.createAccountModel.civilId.trim();

        this.submittingForm.set(true);
        this.otpErrorKey.set(null);
        this.authApi.startRegistration({ phone, civilId }).pipe(
            finalize(() => this.submittingForm.set(false)),
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
            error: (err) => this.handleStartRegistrationError(err),
        });
    }

    ngAfterViewInit(): void {
        // valueChanges also fires for the initial defaultValue set by Formly.
        this.createAccountForm.get('accountType')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value: string) => this.isOrganization.set(value === 'organization'));

        // When governorate changes, reset wilaya and trigger reactive reload.
        this.createAccountForm.get('governorateId')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((id: string) => {
                this.selectedGovernorateId.set(id || null);
                this.createAccountModel.wilaya = '';
                this.createAccountForm.get('wilaya')?.reset(null, { emitEvent: false });
            });
    }

    navigateToLogin(): void {
        this.router.navigate(['../login'], { relativeTo: this.route });
    }

    closeOtpModal(): void {
        this.isOtpModalOpen.set(false);
        this.otpErrorKey.set(null);
    }

    onOtpVerified(code: string): void {
        if (this.submittingOtp()) {
            return;
        }
        this.submittingOtp.set(true);
        this.otpErrorKey.set(null);
        const payload = this.buildVerifyPayload(code);
        this.authApi.verifyRegistration(payload).pipe(
            finalize(() => this.submittingOtp.set(false)),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (envelope) => {
                if (!envelope.isSuccess || !envelope.result) {
                    this.otpErrorKey.set('login.otp.errors.wrongCode');
                    return;
                }
                this.isOtpModalOpen.set(false);
                this.isSuccessModalOpen.set(true);
            },
            error: (err) => this.handleVerifyRegistrationError(err),
        });
    }

    onResend(): void {
        if (this.submittingOtp()) {
            return;
        }
        this.submittingOtp.set(true);
        this.otpErrorKey.set(null);
        this.authApi.resendOtp({ phone: this.createAccountModel.phone.trim() }).pipe(
            finalize(() => this.submittingOtp.set(false)),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (envelope) => {
                if (!envelope.isSuccess || !envelope.result) {
                    this.toast.error('errors.serverTitle', 'errors.serverDetail', envelope);
                    return;
                }
                const { expiresAtUtc, maskedPhone, devCode } = envelope.result;
                this.expiresAtUtc.set(expiresAtUtc);
                if (maskedPhone) {
                    this.serverMaskedPhone.set(maskedPhone);
                }
                this.authService.logDevCode(devCode);
            },
            error: (err) => this.handleResendError(err),
        });
    }

    onSuccessDone(): void {
        this.isSuccessModalOpen.set(false);
        this.router.navigate(['../login'], {
            relativeTo: this.route,
            state: { phone: this.createAccountModel.phone },
        });
    }

    closeSuccessModal(): void {
        this.isSuccessModalOpen.set(false);
    }

    private localMaskedMobileNumber(): string {
        const digits = (this.createAccountModel.phone || '').replace(/\D/g, '');
        if (!digits) {
            return '+968 xxxxxxxx';
        }
        const visiblePart = digits.slice(-4);
        const hiddenPart = 'x'.repeat(Math.max(digits.length - visiblePart.length, 0));
        return `+968 ${hiddenPart}${visiblePart}`;
    }

    private mapLookupOptions(entries: readonly LookupEntityOption[] | null | undefined): DropdownOption<string>[] {
        return (entries ?? []).map((entry) => ({ value: entry.id, label: entry.name }));
    }

    private setSeo(): void {
        this.seo.update({
            title: this.translate.instant('createAccount.seo.title'),
            description: this.translate.instant('createAccount.seo.description'),
            keywords: this.translate.instant('createAccount.seo.keywords'),
            url: this.translate.instant(environment.AppConfig.apiBaseUrl + 'createAccount.seo.url'),
            author: this.translate.instant('createAccount.seo.author'),
            type: 'website',
        });
    }

    private buildVerifyPayload(code: string): RegisterVerifyPayload {
        const m = this.createAccountModel;
        const base = {
            code,
            firstName: m.firstName.trim(),
            lastName: m.lastName.trim(),
            civilId: m.civilId.trim(),
            email: m.emailAddress.trim(),
            address: m.address?.trim() || undefined,
            governorateId: m.governorateId?.trim() || undefined,
            alWilayaId: m.wilaya?.trim() || undefined,
            phone: m.phone.trim(),
        };
        if (m.accountType === 'organization') {
            return {
                ...base,
                accountType: 1,
                companyName: m.companyName.trim(),
                crNumber: m.crNumber.trim(),
                companyPhone: m.companyPhone.trim(),
                companyAddress: m.companyAddress?.trim() || undefined,
            };
        }
        return { ...base, accountType: 0 };
    }

    private handleStartRegistrationError(err: unknown): void {
        if (err instanceof TimeoutError) {
            this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail');
            return;
        }
        if (!(err instanceof HttpErrorResponse)) {
            return;
        }
        switch (err.status) {
            case 400:
                this.toast.error('createAccount.errors.invalidPhoneTitle', 'createAccount.errors.invalidPhoneDetail', err);
                break;
            case 409:
                this.toast.error('createAccount.errors.duplicateTitle', 'createAccount.errors.duplicateDetail', err);
                break;
            case 429:
                this.toast.warn('errors.rateLimitTitle', 'errors.rateLimitDetail', err);
                break;
            case 408:
                this.toast.warn('errors.timeoutTitle', 'errors.timeoutDetail', err);
                break;
            // 0 / 401 / 403 / 5xx already handled by error.interceptor.
            default:
                break;
        }
    }

    private handleVerifyRegistrationError(err: unknown): void {
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
                setTimeout(() => this.closeOtpModal(), 2500);
            } else {
                this.otpErrorKey.set('login.otp.errors.wrongCode');
            }
            return;
        }
        if (err.status === 409) {
            this.closeOtpModal();
            this.toast.error('createAccount.errors.duplicateTitle', 'createAccount.errors.duplicateDetail', err);
        }
    }

    private handleResendError(err: unknown): void {
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
}