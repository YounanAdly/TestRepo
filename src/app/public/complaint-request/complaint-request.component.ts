
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button.component';
import { SuccessAlertModalComponent } from '../../shared/components/success-alert/success-alert-modal.component';
import { ComplaintsApi } from '../../shared/services/complaints/complaints-api.service';
import {
  CreateComplaintPayload,
  CreateGeneralComplaintPayload,
} from '../../shared/services/complaints/complaints.types';
import { FormlyService } from '../../shared/services/formly.service';
import { LanguageService } from '../../shared/services/language.service';
import { LookupApi } from '../../shared/services/lookup/lookup-api.service';
import { LookupOption, LookupOptionSetQuery } from '../../shared/services/lookup/lookup.types';
import { MotionService } from '../../shared/services/motion.service';
import { AuthService } from '../../shared/services/auth.service';
import { SeoService } from '../../shared/services/seo.service';
import { ToastService } from '../../shared/services/toast.service';
import formConfig from './form.json';

type ComplaintType = 'waterLeakage' | 'waterQuality' | 'general';

/**
 * Slug values that can arrive in the `?type=` query param to preselect the
 * sub-category. The only slug we currently route on is `meterIssues` (deep
 * link from the General Complaint card on the public home/complaints page).
 * Once the general option-set resolves, this slug is remapped to its
 * numeric API id via `subCategoryTriggerIds`.
 */
type RoutePreselectedSubCategory = 'meterIssues';

type SectionKey = 'applicant' | 'complaint' | 'documents';

interface ComplaintRequestFormConfig {
  applicantInformation: FormlyFieldConfig[];
  complaintDetails: FormlyFieldConfig[];
  requiredDocuments: FormlyFieldConfig[];
}

@Component({
  selector: 'app-complaint-request',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    ReactiveFormsModule,
    FormlyModule,
    ButtonComponent,
    SuccessAlertModalComponent,
  ],
  templateUrl: './complaint-request.component.html',
  styleUrl: './complaint-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintRequestComponent {
  /** `?type=…` query param, signal-bound via `withComponentInputBinding()`. */
  readonly type = input<string>('');

  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly formlyService = inject(FormlyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly lookupApi = inject(LookupApi);
  private readonly authService = inject(AuthService);
  private readonly complaintsApi = inject(ComplaintsApi);
  private readonly toast = inject(ToastService);
  private readonly motion = inject(MotionService);

  private readonly complaintTitleKeyByType: Record<ComplaintType, string> = {
    waterLeakage: 'complaintsPage.cards.waterLeakage.title',
    waterQuality: 'complaintsPage.cards.waterQuality.title',
    general: 'complaintsPage.cards.general.title',
  };

  /**
   * Dataverse option-set field names per primary complaint type. The
   * sub-category dropdown is sourced from
   * `LookupApi.optionSet({ entityLogicalName: 'incident', fieldName })`
   * and the model stores the numeric `id`.
   */
  private readonly subCategoryFieldNameByType: Record<ComplaintType, string> = {
    waterLeakage: 'ntw_opscomplainttypeforwaterleakagecomplaints',
    waterQuality: 'ntw_opscomplainttypequatlity',
    general: 'ntw_opscomplainttypegeneral',
  };
  private readonly subCategoryEntityLogicalName = 'incident';

  /** Secondary option-set field names — fetched conditionally based on the active sub-category. */
  private readonly meterIssueFieldName = 'ntw_opssubcomplaintmeterissues';
  private readonly waterBillingFieldName = 'ntw_opssubcomplaintwaterbillingpayments';

  /**
   * Trigger sub-category ids per primary complaint type. These are stable
   * Dataverse option-set values that drive the conditional fields below
   * (`anotherReason`, `meterIssue`, `waterBilling`). Matching on the
   * numeric `id` instead of the English label keeps the validation logic
   * decoupled from backend display strings — a UI string change won't
   * silently break visibility / required toggles. Same table also powers
   * the route-preselect slug → numeric id remap (e.g. `?type=meterIssues`
   * → general/2) inside `applySubCategoryOptions()`.
   */
  private readonly subCategoryTriggerIds: Record<
    ComplaintType,
    { otherReasons?: number; meterIssues?: number; waterBilling?: number }
  > = {
    waterLeakage: { otherReasons: 6 },
    waterQuality: { otherReasons: 7 },
    general: { otherReasons: 3, meterIssues: 2, waterBilling: 1 },
  };

  readonly form = new FormGroup({});
  // TODO(profile-wiring): seed from `AuthService.fetchContactInfo()` (or
  // equivalent feature service) once the backend endpoint exists. Field keys
  // must stay in sync with `form.json` applicantInformation.
  readonly model: Record<string, unknown> = {
    customerName: '',
    mobileNumber: '',
    email: '',
    permanentAddress: '',
  };
  // Deep-clone the imported JSON so per-instance mutations from
  // `formlyService.setDropdownValue(...)` / `setFieldVisibility(...)` don't
  // leak across navigations (JSON imports are singleton module instances).
  readonly requestFields: ComplaintRequestFormConfig = structuredClone(
    formConfig as unknown as ComplaintRequestFormConfig,
  );
  /** Set from the API response after a successful submit; rendered in the success modal. */
  readonly submitReferenceNumber = signal<string>('');
  /** Locks the submit button while the POST is in flight so we don't double-submit. */
  readonly isSubmitting = signal(false);

  readonly selectedComplaintType = signal<ComplaintType>('waterLeakage');
  readonly selectedComplaintTitleKey = signal<string>('complaintsPage.cards.waterLeakage.title');
  readonly isSubmitSuccessOpen = signal(false);
  readonly sectionOpen = signal<Record<SectionKey, boolean>>({
    applicant: true,
    complaint: true,
    documents: true,
  });

  /** Raw form value of `complaintSubCategory` — numeric id once the API resolves, or a route-preselect slug, or null. */
  readonly selectedSubCategoryValue = signal<string | number | null>(null);

  private readonly preselectedSubCategory = signal<RoutePreselectedSubCategory | null>(null);
  private readonly lastAppliedRouteType = signal<string | null>(null);

  /** Dataverse option-set query for the active primary type. */
  private readonly subCategoryQuery = computed<LookupOptionSetQuery>(() => ({
    entityLogicalName: this.subCategoryEntityLogicalName,
    fieldName: this.subCategoryFieldNameByType[this.selectedComplaintType()],
  }));

  /** Reactive option-set fetch for the primary case-type dropdown. */
  private readonly subCategoryResource = this.lookupApi.optionSet(() => this.subCategoryQuery());

  /** Full lookup entry for the currently selected sub-category — used on submit. */
  readonly selectedSubCategoryEntry = computed<LookupOption | null>(() => {
    const value = this.selectedSubCategoryValue();
    if (typeof value !== 'number') return null;
    return this.subCategoryResource.value()?.result?.find(o => o.id === value) ?? null;
  });

  /** True when the active selection is "Other Reasons" (id-matched, with a slug fallback for the static path). */
  readonly isOtherReasonsSelected = computed<boolean>(() => {
    const value = this.selectedSubCategoryValue();
    if (value === 'otherReasons') return true;
    const triggers = this.subCategoryTriggerIds[this.selectedComplaintType()];
    return typeof value === 'number' && value === triggers?.otherReasons;
  });

  /** True when complaint type is `general` AND sub-category is "Meter Issues" (id-matched). */
  readonly isMeterIssuesSelected = computed<boolean>(() => {
    if (this.selectedComplaintType() !== 'general') return false;
    const value = this.selectedSubCategoryValue();
    if (value === 'meterIssues') return true;
    const triggers = this.subCategoryTriggerIds.general;
    return typeof value === 'number' && value === triggers?.meterIssues;
  });

  /** True when complaint type is `general` AND sub-category is "Water Service Bills" (id-matched). */
  readonly isWaterBillingSelected = computed<boolean>(() => {
    if (this.selectedComplaintType() !== 'general') return false;
    const value = this.selectedSubCategoryValue();
    const triggers = this.subCategoryTriggerIds.general;
    return typeof value === 'number' && value === triggers?.waterBilling;
  });

  /** Reactive option-set fetch for the meter-issue secondary dropdown — idle unless selected. */
  private readonly meterIssueResource = this.lookupApi.optionSet(() =>
    this.isMeterIssuesSelected()
      ? { entityLogicalName: this.subCategoryEntityLogicalName, fieldName: this.meterIssueFieldName }
      : null,
  );

  /** Reactive option-set fetch for the water-billing secondary dropdown — idle unless selected. */
  private readonly waterBillingResource = this.lookupApi.optionSet(() =>
    this.isWaterBillingSelected()
      ? { entityLogicalName: this.subCategoryEntityLogicalName, fieldName: this.waterBillingFieldName }
      : null,
  );

  /**
   * Config table that pairs each option-set-driven Formly dropdown with
   * its backing `LookupApi` resource. The single `effect()` in the
   * constructor iterates this list — adding a new dependent dropdown is
   * a one-line config entry, not a new method + new effect.
   */
  private readonly dynamicDropdowns = [
    { key: 'complaintSubCategory', resource: this.subCategoryResource },
    { key: 'meterIssue', resource: this.meterIssueResource },
    { key: 'waterBilling', resource: this.waterBillingResource },
  ] as const;

  constructor() {
    // Seed applicant fields reactively. AuthService.profile is an rxResource
    // signal that auto-fetches once per session — no direct API call here.
    effect(() => {
      const p = this.authService.profile();
      if (p) this.applyApplicantProfile(p);
    });

    // React to `?type=…` changes via the route `input()` (router
    // `withComponentInputBinding()` is on globally — see `app.config.ts`).
    effect(() => {
      const routeType = this.type().trim();
      if (this.lastAppliedRouteType() === routeType) {
        return;
      }
      this.lastAppliedRouteType.set(routeType);
      this.applyComplaintType(routeType);
    });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyDropdownOptions();
        this.setSeo();
      });

    // Re-apply every dynamic dropdown's options whenever its resource
    // resolves (initial fetch, primary-type change, secondary visibility
    // flip). Tracking is automatic via the `.value()` reads inside the
    // loop — a config entry is all that's needed for a new dropdown.
    effect(() => {
      for (const d of this.dynamicDropdowns) {
        this.setDynamicDropdownOptions(d.key, d.resource.value()?.result);
      }
      this.remapPreselectedSubCategorySlug();
    });

    // Mirror the live `complaintSubCategory` form value onto the signal so
    // the derived `isMeterIssuesSelected` / `isOtherReasonsSelected`
    // computeds (and the visibility effect below) stay in sync.
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const sub = (value as Record<string, unknown> | null)?.['complaintSubCategory'] ?? null;
        this.selectedSubCategoryValue.set(sub as string | number | null);
      });

    // Toggle conditional fields based on the active selection. Driven by
    // signals so OnPush change detection picks up the `field.hide` /
    // `props.required` mutations without relying on Formly's string
    // expressions (which don't re-evaluate reliably when the model is
    // mutated outside a form-control update).
    effect(() => {
      this.setFieldVisibility('meterIssue', this.isMeterIssuesSelected());
      this.setFieldVisibility('waterBilling', this.isWaterBillingSelected());
      this.setFieldVisibility('anotherReason', this.isOtherReasonsSelected());
    });

    this.destroyRef.onDestroy(() => this.setBodyScrollLocked(false));
  }

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  toggleSection(section: SectionKey): void {
    this.sectionOpen.update(state => ({ ...state, [section]: !state[section] }));
  }

  onCancel(): void {
    this.form.reset({
      customerName: this.model['customerName'],
      mobileNumber: this.model['mobileNumber'],
      email: this.model['email'],
      permanentAddress: this.model['permanentAddress'],
      complaintType: this.selectedComplaintType(),
      complaintSubCategory: this.preselectedSubCategory(),
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    const payload = this.buildSubmitPayload();
    if (!payload) return;

    this.isSubmitting.set(true);
    this.complaintsApi
      .submit(payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          if (response.isSuccess) {
            this.submitReferenceNumber.set(response.result?.ticketNumber ?? '');
            this.openSubmitSuccessAlert();
            return;
          }
          // 200 OK with `isSuccess: false` — server returns a localized
          // domain error; `ToastService` reads `errorMessageEn`/`Ar` off the
          // envelope so the user sees the backend's message verbatim.
          this.toast.error(
            'complaintRequestPage.errors.submitFailedTitle',
            'complaintRequestPage.errors.submitFailedDetail',
            response,
          );
        },
        // 5xx / 0 / 503 / timeout are toasted by `errorInterceptor` — we do
        // not duplicate here. `finalize` releases the submit lock.
        error: () => undefined,
      });
  }

  /**
   * Builds the request body for `ComplaintsApi.submit()`. Only sends the
   * sub-category field that matches the active primary type, and only
   * includes the meter-issue / water-billing fields when their conditional
   * dropdowns are visible. `strAnotherReason` is included only when the
   * user picked "Other Reasons". Returns `null` if the form value is
   * unexpectedly missing the sub-category (defensive — `form.valid`
   * already enforces required, but TS can't prove it).
   */
  private buildSubmitPayload(): CreateComplaintPayload | null {
    const fv = this.form.value as Record<string, unknown>;
    const subId = fv['complaintSubCategory'];
    if (typeof subId !== 'number') return null;

    const details = String(fv['complaintDetails'] ?? '');
    const anotherReason = this.isOtherReasonsSelected()
      ? String(fv['anotherReason'] ?? '').trim()
      : '';

    const base = {
      strComplaintDetails: details,
      strComplaintDescription: details,
      caseTypeCode: '2',
      caseOriginCode: '3',
      ...(anotherReason ? { strAnotherReason: anotherReason } : {}),
    } as const;

    switch (this.selectedComplaintType()) {
      case 'waterLeakage':
        return {
          ...base,
          opsComplaintCategory: 1,
          opsComplaintTypeForWaterLeakageComplaints: subId,
        };
      case 'waterQuality':
        return {
          ...base,
          opsComplaintCategory: 2,
          opsComplaintTypeQuality: subId,
        };
      case 'general': {
        const generalPayload: CreateGeneralComplaintPayload = {
          ...base,
          opsComplaintCategory: 3,
          opsComplaintTypeGeneral: subId,
        };
        if (this.isMeterIssuesSelected() && typeof fv['meterIssue'] === 'number') {
          generalPayload.opsSubComplaintMeterIssues = fv['meterIssue'];
        }
        if (this.isWaterBillingSelected() && typeof fv['waterBilling'] === 'number') {
          generalPayload.opsSubComplaintWaterBillingPayments = fv['waterBilling'];
        }
        return generalPayload;
      }
    }
  }

  onSubmitSuccessDone(): void {
    this.closeSubmitSuccessAlert();
    this.router.navigate(['/', this.currentLang, 'complaints']);
  }

  onSubmitSuccessClose(): void {
    this.closeSubmitSuccessAlert();
    if (isPlatformBrowser(this.platformId)) {
      window.location.reload();
    }
  }

  private applyComplaintType(rawType: string): void {
    const resolved = this.resolveComplaintRoute(rawType);
    this.selectedComplaintType.set(resolved.primary);
    this.preselectedSubCategory.set(resolved.subCategory ?? null);
    this.selectedComplaintTitleKey.set(this.complaintTitleKeyByType[resolved.primary]);
    this.applyDropdownOptions();
    this.applyPreselectedModel();
    this.setSeo();
  }

  private resolveComplaintRoute(type: string): { primary: ComplaintType; subCategory?: RoutePreselectedSubCategory } {
    if (type === 'meterIssues') {
      return { primary: 'general', subCategory: 'meterIssues' };
    }

    if ((['waterLeakage', 'waterQuality', 'general'] as const).includes(type as ComplaintType)) {
      return { primary: type as ComplaintType };
    }

    return { primary: 'waterLeakage' };
  }

  private applyDropdownOptions(): void {
    const primaryOptions = (Object.keys(this.complaintTitleKeyByType) as ComplaintType[]).map(value => ({
      value,
      label: this.translate.instant(this.complaintTitleKeyByType[value]),
    }));
    this.formlyService.setDropdownValue(this.requestFields.complaintDetails, 'complaintType', primaryOptions);

    for (const d of this.dynamicDropdowns) {
      this.setDynamicDropdownOptions(d.key, d.resource.value()?.result);
    }
  }

  /**
   * When the route preselects a sub-category via slug (e.g.
   * `?type=meterIssues`), the form value is initially a string. Once the
   * matching option-set resolves, swap the string for the numeric id from
   * `subCategoryTriggerIds` so the dropdown shows the right preselection
   * and the submit payload carries the correct id.
   */
  private remapPreselectedSubCategorySlug(): void {
    const current = this.selectedSubCategoryValue();
    if (typeof current !== 'string') return;
    const entries = this.subCategoryResource.value()?.result;
    if (!entries?.length) return;
    const triggers = this.subCategoryTriggerIds[this.selectedComplaintType()];
    const remappedId = triggers?.[current as keyof typeof triggers];
    if (typeof remappedId === 'number' && this.form.contains('complaintSubCategory')) {
      this.form.patchValue({ complaintSubCategory: remappedId });
    }
  }

  /**
   * Shared `LookupOption[]` → Formly dropdown options mapper. Uses the
   * numeric `id` as the form value (what the backend expects on submit)
   * and the language-matched `descriptionEn` / `descriptionAr` as the
   * label.
   */
  private setDynamicDropdownOptions(
    key: string,
    entries: readonly LookupOption[] | null | undefined,
  ): void {
    const lang = this.currentLang;
    const options = (entries ?? []).map(entry => ({
      value: entry.id,
      label: lang === 'ar' ? entry.descriptionAr : entry.descriptionEn,
    }));
    this.formlyService.setDropdownValue(this.requestFields.complaintDetails, key, options);
  }

  /**
   * Toggles `field.hide` + `field.props.required` on a Formly field by
   * key. Driven by the visibility effect so the conditional `meterIssue`
   * and `anotherReason` fields react to selection changes deterministically
   * under OnPush — Formly's string `expressions` don't re-evaluate
   * reliably when the model is mutated outside a form-control update.
   */
  private setFieldVisibility(key: string, visible: boolean): void {
    const field = this.formlyService.getField(key, this.requestFields.complaintDetails);
    if (!field) return;
    field.hide = !visible;
    if (field.props) {
      field.props.required = visible;
    }
  }

  private applyPreselectedModel(): void {
    const primary = this.selectedComplaintType();
    const sub = this.preselectedSubCategory();

    this.model['complaintType'] = primary;
    this.model['complaintSubCategory'] = sub;
    this.model['meterIssue'] = null;
    this.model['waterBilling'] = null;
    this.model['anotherReason'] = null;

    // Re-seed the signal so the visibility effect picks up the
    // (potentially pre-selected, e.g. `meterIssues`) sub-category even
    // before the user touches the form.
    this.selectedSubCategoryValue.set(sub);

    if (this.form.contains('complaintType')) {
      this.form.patchValue({
        complaintType: primary,
        complaintSubCategory: sub,
        meterIssue: null,
        waterBilling: null,
        anotherReason: null,
      });
    }
  }

  private applyApplicantProfile(profile: { firstName: string; lastName: string; mobilePhone: string; email: string; address: string }): void {
    const fullName = [profile.firstName, profile.lastName]
      .map(part => part.trim())
      .filter(Boolean)
      .join(' ');

    const applicant = {
      customerName: fullName,
      accountNumber: this.authService.getSelectedAccountId() ?? '',
      mobileNumber: profile.mobilePhone ?? '',
      email: profile.email ?? '',
      permanentAddress: profile.address ?? '',
    } as const;

    Object.assign(this.model, applicant);
    this.form.patchValue(applicant, { emitEvent: false });
  }

  private setSeo(): void {
    this.seo.update({
      title: `${this.translate.instant(this.selectedComplaintTitleKey())} | ${this.translate.instant('complaintRequestPage.seo.titleSuffix')}`,
      description: this.translate.instant('complaintRequestPage.seo.description'),
      keywords: this.translate.instant('complaintRequestPage.seo.keywords'),
      url: this.translate.instant('complaintRequestPage.seo.url'),
      author: this.translate.instant('complaintRequestPage.seo.author'),
      type: 'website',
    });
  }

  private openSubmitSuccessAlert(): void {
    this.isSubmitSuccessOpen.set(true);
    this.scrollToTop();
    this.setBodyScrollLocked(true);
  }

  private closeSubmitSuccessAlert(): void {
    this.isSubmitSuccessOpen.set(false);
    this.setBodyScrollLocked(false);
  }

  private scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const behavior: ScrollBehavior = this.motion.prefersReducedMotion() ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.body.style.overflow = locked ? 'hidden' : '';
  }
}

