import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button.component';
import { SuccessAlertModalComponent } from '../../shared/components/success-alert/success-alert-modal.component';
import { AuthService } from '../../shared/services/auth.service';
import { FormlyService } from '../../shared/services/formly.service';
import { HomePageApi } from '../../shared/services/home-page/home-page-api.service';
import { LookupApi } from '../../shared/services/lookup/lookup-api.service';
import { LookupEntityOption } from '../../shared/services/lookup/lookup.types';
import { LookupOption } from '../../shared/services/lookup/lookup.types';
import { LanguageService } from '../../shared/services/language.service';
import { NocApi } from '../../shared/services/noc/noc-api.service';
import { PlotApi } from '../../shared/services/plot/plot-api.service';
import { TankerApi } from '../../shared/services/tanker/tanker-api.service';
import { SeoService } from '../../shared/services/seo.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DEFAULT_SERVICE_NAME,
  FORM_REGISTRY,
  getServiceByLegacySlug,
  getServiceMetadata,
  isServiceGuid,
  ServiceFormVariant,
  ServiceName,
  ServiceRequestFormConfig,
  toServiceName,
} from './forms';

// ─── Local UI types ──────────────────────────────────────────────────────────

export type PlotOption = 'existing' | 'new';
export type ConnectionType = 'permanent' | 'replacement' | 'temporary';

type SectionKey =
  | 'customer'
  | 'plot'
  | 'connection'
  | 'documents'
  | 'tankerInfo'
  | 'vehicleInfo'
  | 'operator'
  | 'tankerDocs'
  | 'project'
  | 'nocDocs'
  | 'vatDetails'
  | 'vatDocs'
  | 'violationCustomer'
  | 'violationDetailsSection'
  | 'technicalReport'
  | 'violationDocs'
  | 'adminPenalties';

interface DummyPlot {
  value: string;
  label: string;
  plotNumber: string;
  serialSketchNumber: string;
  wilaya: string;
  regionVillage: string;
  landArea: string;
  landNumber: string;
  premisesType: string;
  latitude: string;
  longitude: string;
  functionalLocation: string;
  relatedWaterServiceRequest: string;
  customerAccount: string;
  customerContact: string;
}

// ─── Dummy data (replace with real API calls when ready) ─────────────────────

const DUMMY_PLOTS: DummyPlot[] = [
  {
    value: 'PLT-1001',
    label: 'Plot 1001 – Muscat / Al Khuwair',
    plotNumber: 'PLT-1001',
    serialSketchNumber: '5501',
    wilaya: 'Muscat',
    regionVillage: 'Al Khuwair',
    landArea: '612',
    landNumber: 'LND-4422',
    premisesType: 'Residential',
    latitude: '23.6145',
    longitude: '58.5936',
    functionalLocation: 'FL-MSC-001',
    relatedWaterServiceRequest: 'WSR-2024-0011',
    customerAccount: 'ACC-9001',
    customerContact: 'CON-5501',
  },
  {
    value: 'PLT-1002',
    label: 'Plot 1002 – Seeb / Al Mawaleh',
    plotNumber: 'PLT-1002',
    serialSketchNumber: '5502',
    wilaya: 'Seeb',
    regionVillage: 'Al Mawaleh',
    landArea: '450',
    landNumber: 'LND-4423',
    premisesType: 'Commercial',
    latitude: '23.5977',
    longitude: '58.1854',
    functionalLocation: 'FL-SEB-002',
    relatedWaterServiceRequest: 'WSR-2024-0012',
    customerAccount: 'ACC-9002',
    customerContact: 'CON-5502',
  },
  {
    value: 'PLT-1003',
    label: 'Plot 1003 – Bausher / Ghubrah',
    plotNumber: 'PLT-1003',
    serialSketchNumber: '5503',
    wilaya: 'Bausher',
    regionVillage: 'Ghubrah',
    landArea: '800',
    landNumber: 'LND-4424',
    premisesType: 'Industrial',
    latitude: '23.5894',
    longitude: '58.5513',
    functionalLocation: 'FL-BSR-003',
    relatedWaterServiceRequest: 'WSR-2024-0013',
    customerAccount: 'ACC-9003',
    customerContact: 'CON-5503',
  },
];

// ─── Dataverse identifiers for tanker lookups ────────────────────────────────

const TANKER_ENTITY_LOGICAL_NAME = 'ntw_tankerfillinglicenserequest';
const TANKER_TYPE_FIELD_NAME = 'ntw_opstankertype';

// ─── Dataverse identifiers for NOC lookups ────────────────────────────────────

const NOC_ENTITY_LOGICAL_NAME      = 'ntw_nocrequests';
const NOC_PROJECT_TYPE_FIELD_NAME  = 'ntw_opsprojecttype';
const NOC_SITE_CONDITION_FIELD_NAME = 'ntw_opssitecondition';
const NOC_FUNCTIONAL_LOCATION_ENTITY  = 'msdyn_functionallocation';
const NOC_FUNCTIONAL_LOCATION_COLUMNS = 'msdyn_functionallocationid:id,msdyn_name:name';
const NOC_PROJECT_LOCATION_ENTITY  = 'ntw_alwilaya';
const NOC_PROJECT_LOCATION_COLUMNS = 'ntw_alwilayaid:id,ntw_name:name';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * The page that renders all 15 service forms.
 *
 * ── Data flow ─────────────────────────────────────────────────────────
 * `?service` query param → `selectedServiceParam` signal
 *    ├─ GUID → `HomePageApi.serviceCard()` → `serviceName` from API
 *    └─ legacy slug (e.g. `tanker`) → `getServiceByLegacySlug()`
 *
 * `?serviceName` query param → `selectedServiceNameFromRoute` signal
 *
 * `selectedServiceName()` = API result ?? route param ?? slug fallback
 * `selectedServiceFormVariant()` = SERVICE_CATALOG[name].variant
 * `requestFields()` = deep-cloned FORM_REGISTRY[variant]
 *
 * ── Adding a new service ──────────────────────────────────────────────
 * Everything lives in [`./forms/`](./forms/). See `forms/registry.ts`.
 */
@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    ReactiveFormsModule,
    FormlyModule,
    ButtonComponent,
    SuccessAlertModalComponent,
  ],
  templateUrl: './service-request.component.html',
  styleUrl: './service-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceRequestComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly formlyService = inject(FormlyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly homePageApi = inject(HomePageApi);
  private readonly lookupApi = inject(LookupApi);
  private readonly nocApi = inject(NocApi);
  private readonly plotApi = inject(PlotApi);
  private readonly tankerApi = inject(TankerApi);
  private readonly toast = inject(ToastService);

  // ── Enums exposed for template use (`@switch (variant)` + `@case (Variant.X)`) ──
  protected readonly Variant = ServiceFormVariant;

  readonly connectionTypes: Array<{ value: ConnectionType; labelKey: string }> = [
    { value: 'permanent',   labelKey: 'serviceRequestPage.form.connection.permanent'   },
    { value: 'replacement', labelKey: 'serviceRequestPage.form.connection.replacement' },
    { value: 'temporary',   labelKey: 'serviceRequestPage.form.connection.temporary'   },
  ];

  readonly form = new FormGroup({});
  readonly model: Record<string, unknown> = {};

  // ── Route-driven signals ──────────────────────────────────────────────────
  readonly currentLangSig = signal<string>(this.languageService.getCurrentLanguage() || 'en');
  readonly selectedServiceParam = signal<string>('connection');
  readonly selectedServiceNameFromRoute = signal<ServiceName>(DEFAULT_SERVICE_NAME);
  readonly selectedServiceId = signal<string | null>(null);

  // ── API-backed resource ───────────────────────────────────────────────────
  protected readonly cardResource = this.homePageApi.serviceCard(() => this.selectedServiceId());

  // ── Derived state ─────────────────────────────────────────────────────────

  /** Final resolved service number: API wins, else route param, else fallback. */
  protected readonly selectedServiceName = computed<ServiceName>(() =>
    toServiceName(this.cardResource.value()?.result?.serviceName)
      ?? this.selectedServiceNameFromRoute(),
  );

  /** Metadata (variant + titleKey + slug) for the current service. */
  protected readonly selectedServiceMetadata = computed(() =>
    getServiceMetadata(this.selectedServiceName())
      ?? getServiceMetadata(DEFAULT_SERVICE_NAME)!,
  );

  /** Which form template branch to render. */
  protected readonly selectedServiceFormVariant = computed(
    () => this.selectedServiceMetadata().variant,
  );

  /** Immediate H1 / breadcrumb title — API result supersedes catalog fallback. */
  protected readonly selectedServiceDisplayTitle = computed(() => {
    const card = this.cardResource.value()?.result;
    if (card) {
      return this.currentLangSig() === 'ar' ? card.name : card.serviceCardTitleEnglish;
    }
    return this.translate.instant(this.selectedServiceMetadata().titleKey);
  });

  /** The first-section header key changes per variant (Customer vs. Violation Info). */
  protected readonly firstSectionTitleKey = computed(() => {
    const variant = this.selectedServiceFormVariant();
    if (variant === ServiceFormVariant.Violation)  return 'serviceRequestPage.cards.violationCustomerInfo';
    return 'serviceRequestPage.cards.customerDetails';
  });

  /**
   * Formly field configs for the active variant.
   *
   * Deep-cloned from `FORM_REGISTRY` so per-instance dropdown mutations
   * don't leak across navigations. Recomputes automatically when the
   * variant changes.
   */
  protected readonly requestFields = computed<ServiceRequestFormConfig>(() =>
    structuredClone(FORM_REGISTRY[this.selectedServiceFormVariant()]),
  );

  /** Only water uses the "create new plot" toggle. */
  protected readonly isWaterVariant = computed(
    () => this.selectedServiceFormVariant() === ServiceFormVariant.Water,
  );

  // ── Tanker: reactive option-set for Tanker Type ───────────────────────────
  protected readonly tankerTypeResource = this.lookupApi.optionSet(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Tanker
      ? { entityLogicalName: TANKER_ENTITY_LOGICAL_NAME, fieldName: TANKER_TYPE_FIELD_NAME }
      : null,
  );

  // ── NOC: reactive lookups (all idle while variant !== NOC) ────────────────
  protected readonly nocProjectTypeResource = this.lookupApi.optionSet(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Noc
      ? { entityLogicalName: NOC_ENTITY_LOGICAL_NAME, fieldName: NOC_PROJECT_TYPE_FIELD_NAME }
      : null,
  );

  protected readonly nocSiteConditionResource = this.lookupApi.optionSet(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Noc
      ? { entityLogicalName: NOC_ENTITY_LOGICAL_NAME, fieldName: NOC_SITE_CONDITION_FIELD_NAME }
      : null,
  );

  protected readonly nocFunctionalLocationResource = this.lookupApi.entityLookup(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Noc
      ? { entityName: NOC_FUNCTIONAL_LOCATION_ENTITY, columns: NOC_FUNCTIONAL_LOCATION_COLUMNS }
      : null,
  );

  protected readonly nocProjectLocationResource = this.lookupApi.entityLookup(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Noc
      ? { entityName: NOC_PROJECT_LOCATION_ENTITY, columns: NOC_PROJECT_LOCATION_COLUMNS }
      : null,
  );

  protected readonly violationFunctionalLocationResource = this.lookupApi.entityLookup(() =>
    this.selectedServiceFormVariant() === ServiceFormVariant.Violation
      ? { entityName: NOC_FUNCTIONAL_LOCATION_ENTITY, columns: NOC_FUNCTIONAL_LOCATION_COLUMNS }
      : null,
  );

  protected readonly plotsResource = this.plotApi.list(
    () => this.selectedServiceFormVariant() === ServiceFormVariant.Violation,
  );

  // ── UI toggle state ───────────────────────────────────────────────────────
  readonly plotOption     = signal<PlotOption>('existing');
  readonly connectionType = signal<ConnectionType>('permanent');
  readonly declaration    = signal(false);

  readonly sectionOpen: Record<SectionKey, boolean> = {
    customer:              true,
    plot:                  true,
    connection:            true,
    documents:             true,
    tankerInfo:            true,
    vehicleInfo:           true,
    operator:              true,
    tankerDocs:            true,
    project:               true,
    nocDocs:               true,
    vatDetails:            true,
    vatDocs:               true,
    violationCustomer:     true,
    violationDetailsSection: true,
    technicalReport:       true,
    violationDocs:         true,
    adminPenalties:        true,
  };

  /**
   * Signals — the component is `OnPush`, so async mutations (e.g. inside a
   * `subscribe.next` after a POST) must go through signal setters to mark
   * the view dirty. Plain field writes would silently no-op the modal binding.
   */
  readonly isSubmitSuccessOpen   = signal(false);
  readonly submitReferenceNumber = signal('PF-000540');
  /** Prevents double-submit while a NOC POST is in flight. */
  readonly isSubmitting = signal(false);

  get currentLang(): string {
    return this.currentLangSig();
  }

  constructor() {
    // Prefill customer section from the logged-in profile.
    effect(() => {
      const p = this.authService.profile();
      if (!p) return;
      const isCompany = Number(this.authService.getSession()?.accountType) === 2;
      Object.assign(this.model, {
        customerName:     [p.firstName, p.lastName].filter(Boolean).join(' '),
        civilId:          isCompany ? '' : (p.civilId     ?? ''),
        crNumber:         isCompany ? (p.crNo         ?? '') : '',
        mobileNumber:     p.mobilePhone ?? '',
        email:            p.email       ?? '',
        permanentAddress: p.address     ?? '',
        wilaya:           p.alwilayaName ?? '',
      });
    });

    // Show civil ID for personal accounts; show CR No. for company accounts.
    effect(() => {
      const fields = this.requestFields().customerInformation;
      const isPersonal = Number(this.authService.getSession()?.accountType) !== 2;

      const civilIdField  = this.formlyService.getField('civilId',  fields);
      const crNumberField = this.formlyService.getField('crNumber', fields);

      if (civilIdField) {
        civilIdField.hide = !isPersonal;
        if (civilIdField.props) civilIdField.props['required'] = isPersonal;
      }
      if (crNumberField) {
        crNumberField.hide = isPersonal;
        if (crNumberField.props) crNumberField.props['required'] = !isPersonal;
      }
    });

    // Customer section is informational / pre-filled for all variants —
    // override any required flags set by the effect above.
    effect(() => {
      this.clearRequired(this.requestFields().customerInformation);
    });

    // Keep SEO title in sync with route/language/API changes.
    effect(() => {
      this.selectedServiceDisplayTitle();
      this.setSeo();
    });

    // Force "existing" plot option for any variant that doesn't support "new plot".
    effect(() => {
      if (!this.isWaterVariant() && this.plotOption() !== 'existing') {
        this.plotOption.set('existing');
      }
    });

    // Populate Tanker Type dropdown whenever the resource resolves or
    // the language changes.
    effect(() => {
      const entries = this.tankerTypeResource.value()?.result;
      const lang = this.currentLangSig();
      const options = (entries ?? []).map((e: LookupOption) => ({
        value: e.id,
        label: lang === 'ar' ? e.descriptionAr : e.descriptionEn,
      }));
      this.formlyService.setDropdownValue(
        this.requestFields().tankerInformation, 'tankerType', options,
      );
    });

    // Populate all three NOC dropdowns in one effect so they react together
    // to language changes and individual resource resolutions.
    effect(() => {
      const lang = this.currentLangSig();
      const fields = this.requestFields().projectDetails;

      const projectTypeOptions = (this.nocProjectTypeResource.value()?.result ?? []).map(
        (e: LookupOption) => ({ value: e.id, label: lang === 'ar' ? e.descriptionAr : e.descriptionEn }),
      );
      this.formlyService.setDropdownValue(fields, 'projectType', projectTypeOptions);

      const siteConditionOptions = (this.nocSiteConditionResource.value()?.result ?? []).map(
        (e: LookupOption) => ({ value: e.id, label: lang === 'ar' ? e.descriptionAr : e.descriptionEn }),
      );
      this.formlyService.setDropdownValue(fields, 'siteCondition', siteConditionOptions);

      // Functional location comes from entityLookup — options are language-neutral (name only).
      const functionalLocationOptions = (this.nocFunctionalLocationResource.value()?.result ?? []).map(
        (e: LookupEntityOption) => ({ value: e.id, label: e.name }),
      );
      this.formlyService.setDropdownValue(fields, 'functionalLocation', functionalLocationOptions);

      // Project location (wilaya) — language-neutral (name only).
      const projectLocationOptions = (this.nocProjectLocationResource.value()?.result ?? []).map(
        (e: LookupEntityOption) => ({ value: e.id, label: e.name }),
      );
      this.formlyService.setDropdownValue(fields, 'projectLocation', projectLocationOptions);
    });

    // Populate the Plot dropdown whenever the plots resource resolves.
    effect(() => {
      const plots = this.plotsResource.value()?.result ?? [];
      const options = plots.map(p => ({ value: p.plotId, label: p.name }));
      this.formlyService.setDropdownValue(
        this.requestFields().violationCustomerInfo, 'plot', options,
      );
    });

    // Populate Functional Location for the Violation variant.
    effect(() => {
      const options = (this.violationFunctionalLocationResource.value()?.result ?? []).map(
        (e: LookupEntityOption) => ({ value: e.id, label: e.name }),
      );
      this.formlyService.setDropdownValue(
        this.requestFields().violationDetailFields, 'functionalLocation', options,
      );
    });

    this.destroyRef.onDestroy(() => this.setBodyScrollLocked(false));
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const serviceParam = params.get('service')?.trim() || 'connection';
        const routeServiceName = toServiceName(params.get('serviceName'));
        const legacySlugMatch = getServiceByLegacySlug(serviceParam);

        this.selectedServiceParam.set(serviceParam);
        this.selectedServiceNameFromRoute.set(
          routeServiceName ?? legacySlugMatch?.serviceName ?? DEFAULT_SERVICE_NAME,
        );
        this.selectedServiceId.set(isServiceGuid(serviceParam) ? serviceParam : null);
        this.applyDropdownOptions();
      });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLangSig.set(event.lang);
        this.applyDropdownOptions();
      });

    // Auto-populate plot fields when an existing plot is picked.
    let lastPlotValue: string | null = null;
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue: Record<string, unknown>) => {
        const plotValue = formValue['existingPlot'] as string | null;
        if (!plotValue || plotValue === lastPlotValue) return;
        lastPlotValue = plotValue;
        const plot = DUMMY_PLOTS.find(p => p.value === plotValue);
        if (!plot) return;
        this.form.patchValue(
          {
            plotNumber:                  plot.plotNumber,
            serialSketchNumber:          plot.serialSketchNumber,
            plotWilaya:                  plot.wilaya,
            regionVillage:               plot.regionVillage,
            landArea:                    plot.landArea,
            landNumber:                  plot.landNumber,
            premisesType:                plot.premisesType,
            latitude:                    plot.latitude,
            longitude:                   plot.longitude,
            functionalLocation:          plot.functionalLocation,
            relatedWaterServiceRequest:  plot.relatedWaterServiceRequest,
            customerAccount:             plot.customerAccount,
            customerContact:             plot.customerContact,
          },
          { emitEvent: false },
        );
      });
  }

  toggleSection(section: SectionKey): void {
    this.sectionOpen[section] = !this.sectionOpen[section];
  }

  selectPlotOption(option: PlotOption): void {
    this.plotOption.set(option);
    if (option === 'existing') {
      this.form.patchValue(
        {
          newPlotNumber: null, newSerialSketchNumber: null, newWilaya: null,
          newRegionVillage: null, newLandArea: null, newLandNumber: null,
          newPremisesType: null, newLatitude: null, newLongitude: null,
          newNoOfFloors: null, newTotalBuildingArea: null,
        },
        { emitEvent: false },
      );
    } else {
      this.form.patchValue(
        {
          existingPlot: null, plotNumber: null, serialSketchNumber: null,
          plotWilaya: null, regionVillage: null, landArea: null, landNumber: null,
          premisesType: null, latitude: null, longitude: null,
          functionalLocation: null, relatedWaterServiceRequest: null,
          customerAccount: null, customerContact: null,
        },
        { emitEvent: false },
      );
    }
  }

  selectConnectionType(type: ConnectionType): void {
    this.connectionType.set(type);
  }

  toggleDeclaration(): void {
    this.declaration.update(v => !v);
  }

  onCancel(): void {
    this.form.reset();
    this.plotOption.set('existing');
    this.connectionType.set('permanent');
    this.declaration.set(false);
  }

  onSubmit(): void {
    // Customer fields are pre-filled / informational across all variants —
    // strip any residual required validators before the validity gate runs.
    this.clearRequired(this.requestFields().customerInformation);

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    if (this.selectedServiceFormVariant() === ServiceFormVariant.Noc) {
      this.submitNoc();
      return;
    }

    if (this.selectedServiceFormVariant() === ServiceFormVariant.Tanker) {
      this.submitTanker();
      return;
    }

    // Other variants — open success modal directly (placeholder until each
    // variant has its own API wired up).
    this.openSubmitSuccessAlert();
  }

  private submitNoc(): void {
    const fv = this.form.value as Record<string, unknown>;
    const fd = new FormData();

    fd.append('ProjectLocationId', String(fv['projectLocation'] ?? ''));
    fd.append('ProjectName',       String(fv['projectName']     ?? ''));
    fd.append('ProjectType',       String(fv['projectType']     ?? ''));
    fd.append('SiteCondition',     String(fv['siteCondition']   ?? ''));
    fd.append('FunctionalLocationId', String(fv['functionalLocation'] ?? ''));

    const nocLetter = fv['nocLetterToMarafiq'];
    if (nocLetter instanceof File) {
      fd.append('NocLetterToMarafiq', nocLetter, nocLetter.name);
    }

    const drawing = fv['drawingKrooki'];
    if (drawing instanceof File) {
      fd.append('DrawingKrooki', drawing, drawing.name);
    }

    this.isSubmitting.set(true);
    this.nocApi
      .submit(fd)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          if (response.isSuccess) {
            this.submitReferenceNumber.set(response.result?.nocNumber ?? '');
            this.openSubmitSuccessAlert();
            return;
          }
          // 200 OK with isSuccess: false — show the backend's localized error.
          this.toast.error(
            'serviceRequestPage.errors.submitFailedTitle',
            'serviceRequestPage.errors.submitFailedDetail',
            response,
          );
        },
        // 5xx / 0 / 503 / timeout are handled by errorInterceptor.
        error: () => undefined,
      });
  }

  private submitTanker(): void {
    const fv = this.form.value as Record<string, unknown>;
    const fd = new FormData();

    fd.append('TankerType',    String(fv['tankerType']    ?? ''));
    fd.append('TankCapacity',  String(fv['tankCapacity']  ?? ''));
    fd.append('PlateNumber',   String(fv['plateNumber']   ?? ''));
    fd.append('VehicleBrand',  String(fv['vehicleMake']   ?? ''));
    fd.append('VehicleModel',  String(fv['vehicleModel']  ?? ''));
    fd.append('ModelYear',     String(fv['modelYear']     ?? ''));

    const vehicleRegFile = fv['mulkiyaFile'];
    if (vehicleRegFile instanceof File) {
      fd.append('VehicleRegistrationFile', vehicleRegFile, vehicleRegFile.name);
    }

    const commercialRegFile = fv['commercialRegistrationFile'];
    if (commercialRegFile instanceof File) {
      fd.append('CommercialRegistrationFile', commercialRegFile, commercialRegFile.name);
    }

    const nationalIdFile = fv['nationalIdFile'];
    if (nationalIdFile instanceof File) {
      fd.append('NationalIdFile', nationalIdFile, nationalIdFile.name);
    }

    this.isSubmitting.set(true);
    this.tankerApi
      .submit(fd)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          if (response.isSuccess) {
            this.submitReferenceNumber.set(response.result?.applicationNumber ?? '');
            this.openSubmitSuccessAlert();
            return;
          }
          // 200 OK with isSuccess: false — show the backend's localized error.
          this.toast.error(
            'serviceRequestPage.errors.submitFailedTitle',
            'serviceRequestPage.errors.submitFailedDetail',
            response,
          );
        },
        // 5xx / 0 / 503 / timeout are handled by errorInterceptor.
        error: () => undefined,
      });
  }

  onSubmitSuccessDone(): void {
    this.closeSubmitSuccessAlert();
    this.onCancel();
  }

  onSubmitSuccessClose(): void {
    this.closeSubmitSuccessAlert();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private applyDropdownOptions(): void {
    const fields = this.requestFields();

    const plotOptions = DUMMY_PLOTS.map(p => ({ value: p.value, label: p.label }));
    this.formlyService.setDropdownValue(fields.existingPlotType1Fields, 'existingPlot', plotOptions);
    this.formlyService.setDropdownValue(fields.existingPlotType234Fields, 'existingPlot', plotOptions);

    const wilayaOptions = [
      { value: 'muscat',   label: this.translate.instant('serviceRequestPage.options.wilaya.muscat')   },
      { value: 'seeb',     label: this.translate.instant('serviceRequestPage.options.wilaya.seeb')     },
      { value: 'bausher',  label: this.translate.instant('serviceRequestPage.options.wilaya.bausher')  },
      { value: 'muttrah',  label: this.translate.instant('serviceRequestPage.options.wilaya.muttrah')  },
      { value: 'qurayyat', label: this.translate.instant('serviceRequestPage.options.wilaya.qurayyat') },
    ];
    this.formlyService.setDropdownValue(fields.newPlotFields, 'newWilaya', wilayaOptions);

    const premisesTypeOptions = [
      { value: 'residential', label: this.translate.instant('serviceRequestPage.options.premisesType.residential') },
      { value: 'commercial',  label: this.translate.instant('serviceRequestPage.options.premisesType.commercial')  },
      { value: 'industrial',  label: this.translate.instant('serviceRequestPage.options.premisesType.industrial')  },
      { value: 'agricultural',label: this.translate.instant('serviceRequestPage.options.premisesType.agricultural')},
    ];
    this.formlyService.setDropdownValue(fields.newPlotFields, 'newPremisesType', premisesTypeOptions);
  }

  /** Recursively removes `required` from every field's props AND from its live
   * AbstractControl validator (safe to call before controls exist — skips if null). */
  private clearRequired(fields: FormlyFieldConfig[]): void {
    for (const f of fields) {
      if (f.props) f.props['required'] = false;
      if (f.key && typeof f.key === 'string') {
        const ctrl = this.form.get(f.key);
        if (ctrl) {
          ctrl.removeValidators(Validators.required);
          ctrl.updateValueAndValidity({ emitEvent: false });
        }
      }
      if (f.fieldGroup) this.clearRequired(f.fieldGroup);
    }
  }

  private setSeo(): void {
    const title = this.selectedServiceDisplayTitle()
      || this.translate.instant(this.selectedServiceMetadata().titleKey);
    this.seo.update({
      title:       `${title} | ${this.translate.instant('serviceRequestPage.seo.titleSuffix')}`,
      description: this.translate.instant('serviceRequestPage.seo.description'),
      keywords:    this.translate.instant('serviceRequestPage.seo.keywords'),
      url:         this.translate.instant('serviceRequestPage.seo.url'),
      author:      this.translate.instant('serviceRequestPage.seo.author'),
      type:        'website',
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
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }
}
