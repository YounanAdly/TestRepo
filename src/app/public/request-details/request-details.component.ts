
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthService } from '../../shared/services/auth.service';
import { ComplaintsApi } from '../../shared/services/complaints/complaints-api.service';
import { ComplaintDetailResult } from '../../shared/services/complaints/complaints.types';
import { LanguageService } from '../../shared/services/language.service';
import { LookupApi } from '../../shared/services/lookup/lookup-api.service';
import { LookupOption } from '../../shared/services/lookup/lookup.types';
import { SeoService } from '../../shared/services/seo.service';

type DetailSectionId = 'applicant' | 'connection' | 'land' | 'documents';

interface DetailField {
  labelKey: string;
  valueKey: string;
}

interface DetailSection {
  id: Exclude<DetailSectionId, 'documents'>;
  titleKey: string;
  fields: DetailField[];
}

interface DocumentRow {
  labelKey: string;
  fileNameKey: string;
}

/** Query-param `kind=complaint` opens the complaint variant of this screen. */
type RequestKind = 'complaint' | '';

/** Section id for the dynamic complaint variant. */
type ComplaintSectionId = 'applicant' | 'complaint';

interface ComplaintFieldRow {
  labelKey: string;
  value: string;
}

interface ComplaintSectionVM {
  id: ComplaintSectionId;
  titleKey: string;
  fields: ComplaintFieldRow[];
}

type StatusVariant = 'pending' | 'approved';

/** Dataverse entity + field names — mirror `ComplaintRequestComponent` so
 *  the same option-sets are reused for label resolution here. */
const COMPLAINT_ENTITY = 'incident';
const SUB_CATEGORY_FIELD_BY_PRIMARY: Record<number, string> = {
  1: 'ntw_opscomplainttypeforwaterleakagecomplaints',
  2: 'ntw_opscomplainttypequatlity',
  3: 'ntw_opscomplainttypegeneral',
};
const METER_ISSUE_FIELD = 'ntw_opssubcomplaintmeterissues';
const WATER_BILLING_FIELD = 'ntw_opssubcomplaintwaterbillingpayments';
const PRIMARY_TITLE_KEY_BY_CATEGORY: Record<number, string> = {
  1: 'complaintRequestPage.complaintOptions.primary.waterLeakage',
  2: 'complaintRequestPage.complaintOptions.primary.waterQuality',
  3: 'complaintRequestPage.complaintOptions.primary.general',
};
/** `status.id` for the "In Progress" backend status — drives the amber pending badge. */
const STATUS_ID_IN_PROGRESS = 1;

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [RouterLink, TranslateModule, SkeletonLoaderComponent],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetailsComponent {
  /** Ticket number (`?ref=…`) — bound via `withComponentInputBinding()`. */
  readonly ref = input<string>('');
  /** Variant selector (`?kind=complaint` renders the complaint view). */
  readonly kind = input<RequestKind>('');
  /** Translation key for the summary card title (fallback for the service variant). */
  readonly titleKey = input<string>('requestDetailsPage.summary.serviceTitle');

  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly complaintsApi = inject(ComplaintsApi);
  private readonly lookupApi = inject(LookupApi);
  private readonly authService = inject(AuthService);

  /** Reactive language signal — every dependent computed re-runs on switch. */
  private readonly currentLangSignal = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang || 'en'),
    ),
    { initialValue: this.translate.currentLang || 'en' },
  );

  /** Signal-shaped state for the section accordions so OnPush picks up toggles. */
  readonly sectionOpen = signal<Record<DetailSectionId, boolean>>({
    applicant: true,
    connection: true,
    land: true,
    documents: true,
  });

  readonly isComplaintKind = computed(() => this.kind() === 'complaint');

  /** Reactive fetch of a single complaint — idle unless kind=complaint AND ref is set. */
  readonly complaintDetailResource = this.complaintsApi.detail(
    () => (this.isComplaintKind() ? this.ref() : null),
  );

  private readonly complaint = computed<ComplaintDetailResult | null>(
    () => this.complaintDetailResource.value()?.result ?? null,
  );

  // ── Option-set label resolution ─────────────────────────────────────────

  /** Primary sub-category option-set (differs by `opsComplaintCategory`). */
  private readonly subCategoryResource = this.lookupApi.optionSet(() => {
    const cat = this.complaint()?.opsComplaintCategory;
    if (cat == null) return null;
    const fieldName = SUB_CATEGORY_FIELD_BY_PRIMARY[cat];
    return fieldName ? { entityLogicalName: COMPLAINT_ENTITY, fieldName } : null;
  });

  /** Secondary meter-issue option-set — idle unless the response has that id. */
  private readonly meterIssueResource = this.lookupApi.optionSet(() =>
    this.complaint()?.opsSubComplaintMeterIssues != null
      ? { entityLogicalName: COMPLAINT_ENTITY, fieldName: METER_ISSUE_FIELD }
      : null,
  );

  /** Secondary water-billing option-set — idle unless the response has that id. */
  private readonly waterBillingResource = this.lookupApi.optionSet(() =>
    this.complaint()?.opsSubComplaintWaterBillingPayments != null
      ? { entityLogicalName: COMPLAINT_ENTITY, fieldName: WATER_BILLING_FIELD }
      : null,
  );

  private readonly complaintTypeLabel = computed<string>(() => {
    const cat = this.complaint()?.opsComplaintCategory;
    if (cat == null) return '';
    const key = PRIMARY_TITLE_KEY_BY_CATEGORY[cat];
    return key ? this.translate.instant(key) : '';
  });

  private readonly subCategoryLabel = computed<string>(() => {
    const c = this.complaint();
    if (!c) return '';
    const subId = this.pickSubCategoryId(c);
    if (subId == null) return '';
    return this.pickLookupLabel(this.subCategoryResource.value()?.result, subId);
  });

  private readonly meterIssueLabel = computed<string>(() => {
    const id = this.complaint()?.opsSubComplaintMeterIssues;
    if (id == null) return '';
    return this.pickLookupLabel(this.meterIssueResource.value()?.result, id);
  });

  private readonly waterBillingLabel = computed<string>(() => {
    const id = this.complaint()?.opsSubComplaintWaterBillingPayments;
    if (id == null) return '';
    return this.pickLookupLabel(this.waterBillingResource.value()?.result, id);
  });

  // ── Summary card VM ─────────────────────────────────────────────────────

  readonly summaryTitle = computed<string>(() => {
    if (this.isComplaintKind()) {
      return this.complaintTypeLabel() || this.translate.instant('requestDetailsPage.complaint.fallbackTitle');
    }
    return this.translate.instant(this.titleKey());
  });

  readonly summarySubtitle = computed<string>(() =>
    this.translate.instant(
      this.isComplaintKind()
        ? 'requestDetailsPage.complaint.hero.subtitle'
        : 'requestDetailsPage.hero.subtitle',
    ),
  );

  readonly summaryReference = computed<string>(() => {
    if (this.isComplaintKind()) {
      return this.complaint()?.caseNumber ?? this.ref();
    }
    return this.ref() || 'NFZ12345677';
  });

  readonly statusVariant = computed<StatusVariant>(() =>
    Number(this.complaint()?.status?.id) === STATUS_ID_IN_PROGRESS ? 'pending' : 'approved',
  );

  readonly statusLabel = computed<string>(() => {
    const s = this.complaint()?.status;
    if (!s) return '';
    const primary = this.currentLangSignal() === 'ar' ? s.descriptionAr : s.descriptionEn;
    return (primary ?? s.description ?? '').trim();
  });

  readonly statusIconSrc = computed<string>(() =>
    this.statusVariant() === 'pending'
      ? 'assets/images/inquiry-status-pending.svg'
      : 'assets/images/inquiry-status-approved.svg',
  );

  // ── Complaint sections VM ───────────────────────────────────────────────

  readonly complaintSections = computed<ComplaintSectionVM[]>(() => {
    const c = this.complaint();
    if (!c) return [];

    const profile = this.authService.profile();
    const fullName = [profile?.firstName, profile?.lastName]
      .map(p => p?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
    const customerName = fullName || c.customerAccountName || c.primaryContactName || '';
    const accountNumber = this.authService.getSelectedAccountId() ?? '';
    const empty = this.translate.instant('common.notAvailable');

    const applicantFields: ComplaintFieldRow[] = [
      { labelKey: 'complaintRequestPage.form.applicant.customerName.label', value: customerName || empty },
      { labelKey: 'complaintRequestPage.form.applicant.accountNumber.label', value: accountNumber || empty },
      { labelKey: 'complaintRequestPage.form.applicant.mobileNumber.label', value: profile?.mobilePhone || empty },
      { labelKey: 'complaintRequestPage.form.applicant.email.label', value: profile?.email || empty },
      { labelKey: 'complaintRequestPage.form.applicant.permanentAddress.label', value: profile?.address || empty },
    ];

    const complaintFields: ComplaintFieldRow[] = [
      { labelKey: 'complaintRequestPage.form.complaint.complaintType.label', value: this.complaintTypeLabel() || empty },
      { labelKey: 'complaintRequestPage.form.complaint.subCategory.label', value: this.subCategoryLabel() || empty },
    ];
    if (c.opsSubComplaintMeterIssues != null) {
      complaintFields.push({
        labelKey: 'complaintRequestPage.form.complaint.meterIssue.label',
        value: this.meterIssueLabel() || empty,
      });
    }
    if (c.opsSubComplaintWaterBillingPayments != null) {
      complaintFields.push({
        labelKey: 'complaintRequestPage.form.complaint.waterBilling.label',
        value: this.waterBillingLabel() || empty,
      });
    }
    complaintFields.push({
      labelKey: 'complaintRequestPage.form.complaint.complaintDetails.label',
      value: (c.description ?? '').trim() || empty,
    });
    if (c.anotherReason) {
      complaintFields.push({
        labelKey: 'complaintRequestPage.form.complaint.anotherReason.label',
        value: c.anotherReason,
      });
    }

    return [
      { id: 'applicant', titleKey: 'complaintRequestPage.cards.customerRequestDetails', fields: applicantFields },
      { id: 'complaint', titleKey: 'complaintRequestPage.cards.complaintDetails', fields: complaintFields },
    ];
  });

  // ── Legacy service-variant static data (unchanged) ──────────────────────

  readonly detailSections: DetailSection[] = [
    {
      id: 'connection',
      titleKey: 'serviceRequestPage.cards.connectionInformation',
      fields: [
        { labelKey: 'serviceRequestPage.form.connection.connectionType.label', valueKey: 'requestDetailsPage.values.connection.connectionType' },
        { labelKey: 'serviceRequestPage.form.connection.numberOfFloors.label', valueKey: 'requestDetailsPage.values.connection.numberOfFloors' },
        { labelKey: 'serviceRequestPage.form.connection.premisesType.label', valueKey: 'requestDetailsPage.values.connection.premisesType' },
        { labelKey: 'serviceRequestPage.form.connection.numberOfMeters.label', valueKey: 'requestDetailsPage.values.connection.numberOfMeters' },
        { labelKey: 'serviceRequestPage.form.connection.expectedDailyConsumption.label', valueKey: 'requestDetailsPage.values.connection.expectedDailyConsumption' },
        { labelKey: 'serviceRequestPage.form.connection.totalBuildingArea.label', valueKey: 'requestDetailsPage.values.connection.totalBuildingArea' },
        { labelKey: 'serviceRequestPage.form.connection.tankCapacity.label', valueKey: 'requestDetailsPage.values.connection.tankCapacity' },
      ],
    },
    {
      id: 'applicant',
      titleKey: 'serviceRequestPage.cards.customerDetails',
      fields: [
        { labelKey: 'serviceRequestPage.form.applicant.customerName.label', valueKey: 'requestDetailsPage.values.applicant.customerName' },
        { labelKey: 'serviceRequestPage.form.applicant.email.label', valueKey: 'requestDetailsPage.values.applicant.email' },
        { labelKey: 'serviceRequestPage.form.applicant.civilId.label', valueKey: 'requestDetailsPage.values.applicant.civilId' },
        { labelKey: 'serviceRequestPage.form.applicant.permanentAddress.label', valueKey: 'requestDetailsPage.values.applicant.permanentAddress' },
        { labelKey: 'serviceRequestPage.form.applicant.crNumber.label', valueKey: 'requestDetailsPage.values.applicant.crNumber' },
        { labelKey: 'serviceRequestPage.form.applicant.wilaya.label', valueKey: 'requestDetailsPage.values.applicant.wilaya' },
        { labelKey: 'serviceRequestPage.form.applicant.mobileNumber.label', valueKey: 'requestDetailsPage.values.applicant.mobileNumber' },
      ],
    },
    {
      id: 'land',
      titleKey: 'serviceRequestPage.cards.landLocationDetails',
      fields: [
        { labelKey: 'serviceRequestPage.form.land.region.label', valueKey: 'requestDetailsPage.values.land.region' },
        { labelKey: 'serviceRequestPage.form.land.serialSketchNumber.label', valueKey: 'requestDetailsPage.values.land.serialSketchNumber' },
        { labelKey: 'serviceRequestPage.form.land.landNumber.label', valueKey: 'requestDetailsPage.values.land.landNumber' },
        { labelKey: 'serviceRequestPage.form.land.landArea.label', valueKey: 'requestDetailsPage.values.land.landArea' },
      ],
    },
  ];

  readonly requiredDocuments: DocumentRow[] = [
    { labelKey: 'serviceRequestPage.form.documents.ownershipDeed.label', fileNameKey: 'requestDetailsPage.documents.files.ownershipDeed' },
    { labelKey: 'serviceRequestPage.form.documents.civilIdOrCr.label', fileNameKey: 'requestDetailsPage.documents.files.civilIdOrCr' },
    { labelKey: 'serviceRequestPage.form.documents.landSurveySketch.label', fileNameKey: 'requestDetailsPage.documents.files.landSurveySketch' },
    { labelKey: 'serviceRequestPage.form.documents.serviceConnectionForm.label', fileNameKey: 'requestDetailsPage.documents.files.serviceConnectionForm' },
    { labelKey: 'serviceRequestPage.form.documents.buildingPermit.label', fileNameKey: 'requestDetailsPage.documents.files.buildingPermit' },
    { labelKey: 'serviceRequestPage.form.documents.usufructAgreement.label', fileNameKey: 'requestDetailsPage.documents.files.usufructAgreement' },
  ];

  ngOnInit(): void {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setSeo());
  }

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  /** Legacy service-variant title fallback (kept for existing dashboard callers). */
  get requestTitleKey(): string {
    return this.titleKey();
  }

  toggleSection(section: DetailSectionId | ComplaintSectionId): void {
    this.sectionOpen.update(state => ({
      ...state,
      [section]: !state[section as DetailSectionId],
    }));
  }

  isSectionOpen(section: DetailSectionId | ComplaintSectionId): boolean {
    return this.sectionOpen()[section as DetailSectionId];
  }

  trackBySection(_index: number, section: { id: string }): string {
    return section.id;
  }

  trackByLabel(_index: number, item: { labelKey: string }): string {
    return item.labelKey;
  }

  private pickSubCategoryId(c: ComplaintDetailResult): number | null {
    switch (c.opsComplaintCategory) {
      case 1: return c.opsComplaintTypeForWaterLeakageComplaints;
      case 2: return c.opsComplaintTypeQuality;
      case 3: return c.opsComplaintTypeGeneral;
      default: return null;
    }
  }

  private pickLookupLabel(
    entries: readonly LookupOption[] | null | undefined,
    id: number,
  ): string {
    const found = entries?.find(o => o.id === id);
    if (!found) return '';
    return this.currentLangSignal() === 'ar' ? found.descriptionAr : found.descriptionEn;
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('requestDetailsPage.seo.title'),
      description: this.translate.instant('requestDetailsPage.seo.description'),
      keywords: this.translate.instant('requestDetailsPage.seo.keywords'),
      url: this.translate.instant('requestDetailsPage.seo.url'),
      author: this.translate.instant('requestDetailsPage.seo.author'),
      type: 'website',
    });
  }
}

