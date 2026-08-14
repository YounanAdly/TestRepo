
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { FilterDropdownComponent, MONTH_OPTIONS, YEAR_OPTIONS, FilterOption } from '../../shared/components/filter-dropdown/filter-dropdown.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ComplaintsApi } from '../../shared/services/complaints/complaints-api.service';
import { ComplaintListItem, ComplaintStatusDto } from '../../shared/services/complaints/complaints.types';
import { SeoService } from '../../shared/services/seo.service';

/** Primary complaint categories shown on this page (matches the `?type=` query param). */
type ComplaintType = 'waterLeakage' | 'waterQuality' | 'general';

type StatusVariant = 'pending' | 'approved';

interface ComplaintCard {
  type: ComplaintType;
  titleKey: string;
  descKey: string;
  imgSrc: string;
  imgAltKey: string;
  cardBg: string;
  iconBg: string;
}

/** Pre-computed per-row view-model — avoids re-deriving label/variant on every CD pass. */
interface ComplaintCardVM {
  incidentId: string;
  ticketNumber: string;
  title: string;
  description: string;
  dateLabel: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  statusIconSrc: string;
}

const COMPLAINTS_PAGE_SIZE = 4;
/** `status.id` for the "In Progress" backend status — drives the amber pending badge. */
const STATUS_ID_IN_PROGRESS = 1;

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [RouterLink, TranslateModule, FilterDropdownComponent, SkeletonLoaderComponent],
  templateUrl: './complaints.component.html',
  styleUrl: './complaints.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsComponent {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly complaintsApi = inject(ComplaintsApi);
  private readonly destroyRef = inject(DestroyRef);

  /** Reactive language signal — derived from `TranslateService.onLangChange` so every dependent computed re-runs on switch. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang || 'en'),
    ),
    { initialValue: this.translate.currentLang || 'en' },
  );

  // Default the month/year filters to the current date so the data shown
  // matches the filter displayed; falls back to the first option if the
  // current month/year isn't in `MONTH_OPTIONS` / `YEAR_OPTIONS`.
  private readonly now = new Date();
  private readonly currentMonth = this.now.getMonth() + 1;
  private readonly currentYear = this.now.getFullYear();
  private readonly defaultMonthOption =
    MONTH_OPTIONS.find(o => Number(o.value) === this.currentMonth) ?? MONTH_OPTIONS[0];
  private readonly defaultYearOption =
    YEAR_OPTIONS.find(o => Number(o.value) === this.currentYear) ?? YEAR_OPTIONS[0];

  protected readonly selectedMonthKey = signal<string>(this.defaultMonthOption.labelKey);
  protected readonly selectedYearKey = signal<string>(this.defaultYearOption.labelKey);
  protected readonly selectedMonth = signal<number>(Number(this.defaultMonthOption.value));
  protected readonly selectedYear = signal<number>(Number(this.defaultYearOption.value));
  readonly monthOptions = MONTH_OPTIONS;
  readonly yearOptions = YEAR_OPTIONS;

  /** Cached `Intl.DateTimeFormat` per locale — formatter construction is expensive. */
  private readonly dateFormatters = new Map<string, Intl.DateTimeFormat>();

  constructor() {
    this.applySeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applySeo());
  }

  /**
   * Reactive read of `/api/v1/cases/complaints?month=MM&year=YYYY`.
   * Re-fires automatically whenever `selectedMonth` or `selectedYear` changes
   * because those signals are read inside the params factory.
   */
  protected readonly complaintsResource = this.complaintsApi.list(
    () => ({ month: this.selectedMonth(), year: this.selectedYear() }),
  );

  protected readonly items = computed<ComplaintListItem[]>(
    () => this.complaintsResource.value()?.result ?? [],
  );

  protected readonly totalPages = computed(
    () => Math.max(1, Math.ceil(this.items().length / COMPLAINTS_PAGE_SIZE)),
  );

  // Clamp current page when the dataset shrinks so the user never lands on a non-existent page.
  protected readonly currentPage = linkedSignal<number, number>({
    source: () => this.totalPages(),
    computation: (total, prev) => Math.min(prev?.value ?? 1, total),
  });

  protected readonly pagesArray = computed(
    () => Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  /**
   * Pre-derived per-row view-model. Bind the template to these flat fields
   * instead of calling `statusText()` / `formatDate()` per binding — keeps
   * OnPush CD cheap and recomputes only when items / page / language change.
   */
  protected readonly paginatedView = computed<ComplaintCardVM[]>(() => {
    const start = (this.currentPage() - 1) * COMPLAINTS_PAGE_SIZE;
    const slice = this.items().slice(start, start + COMPLAINTS_PAGE_SIZE);
    const lang = this.currentLang();
    return slice.map(item => this.toCardVM(item, lang));
  });

  /** True when there are no complaints at all (vs. filtered out). Drives the empty-state copy. */
  protected readonly hasNoComplaints = computed(() => this.items().length === 0);

  /** Used by the pagination visibility guard in the template. */
  protected readonly hasResults = computed(() => this.items().length > 0);

  readonly complaintCards: ComplaintCard[] = [
    {
      type: 'waterLeakage',
      titleKey: 'complaintsPage.cards.waterLeakage.title',
      descKey: 'home.complaints.cards.waterLeakage.description',
      imgSrc: 'assets/images/complaint-water-quality.png',
      imgAltKey: 'home.complaints.cards.waterLeakage.imageAlt',
      cardBg: 'var(--color-complaint-card-warm)',
      iconBg: 'var(--color-complaints-leakage-icon-bg)',
    },
    {
      type: 'waterQuality',
      titleKey: 'complaintsPage.cards.waterQuality.title',
      descKey: 'home.complaints.cards.waterQuality.description',
      imgSrc: 'assets/images/complaint-water-leakage.png',
      imgAltKey: 'home.complaints.cards.waterQuality.imageAlt',
      cardBg: 'var(--color-complaints-water-quality-bg)',
      iconBg: 'var(--color-complaints-water-quality-icon-bg)',
    },
    {
      type: 'general',
      titleKey: 'complaintsPage.cards.general.title',
      descKey: 'home.complaints.cards.general.description',
      imgSrc: 'assets/images/complaint-general.png',
      imgAltKey: 'home.complaints.cards.general.imageAlt',
      cardBg: 'var(--color-complaint-card-sky)',
      iconBg: 'var(--color-complaints-general-icon-bg)',
    },
  ];

  getLocalizedRoute(route: string): string[] {
    return ['/', this.currentLang(), route];
  }

  navigateToComplaintForm(type: ComplaintType): void {
    void this.router.navigate(
      ['/', this.currentLang(), 'complaint-request'],
      { queryParams: { type } },
    );
  }

  /**
   * Opens the "My Requests" details screen for a submitted complaint.
   * The details resource in `RequestDetailsComponent` keys off the
   * `ref` (ticket number) and `kind=complaint` query params.
   */
  viewComplaintDetails(ticketNumber: string): void {
    void this.router.navigate(
      ['/', this.currentLang(), 'request-details'],
      { queryParams: { ref: ticketNumber, kind: 'complaint' } },
    );
  }

  goBack(): void {
    void this.router.navigate(['/', this.currentLang(), 'home']);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }

  prevPage(): void {
    const page = this.currentPage();
    if (page > 1) this.currentPage.set(page - 1);
  }

  nextPage(): void {
    const page = this.currentPage();
    if (page < this.totalPages()) this.currentPage.set(page + 1);
  }

  onMonthChange(option: FilterOption): void {
    this.selectedMonthKey.set(option.labelKey);
    this.selectedMonth.set(Number(option.value));
  }

  onYearChange(option: FilterOption): void {
    this.selectedYearKey.set(option.labelKey);
    this.selectedYear.set(Number(option.value));
  }

  private applySeo(): void {
    this.seo.update({
      title: this.translate.instant('complaintsPage.seo.title'),
      description: this.translate.instant('complaintsPage.seo.description'),
    });
  }

  private toCardVM(item: ComplaintListItem, lang: string): ComplaintCardVM {
    const variant: StatusVariant = Number(item.status?.id) === STATUS_ID_IN_PROGRESS
      ? 'pending'
      : 'approved';
    return {
      incidentId: item.incidentId,
      ticketNumber: item.ticketNumber,
      title: item.title,
      description: item.description,
      dateLabel: this.formatDate(item.createdOn, lang),
      statusLabel: this.statusText(item.status, lang),
      statusVariant: variant,
      statusIconSrc: variant === 'pending'
        ? 'assets/images/inquiry-status-pending.svg'
        : 'assets/images/inquiry-status-approved.svg',
    };
  }

  /** Language-matched status text, falling back to the neutral `description`. */
  private statusText(status: ComplaintStatusDto | undefined | null, lang: string): string {
    if (!status) return '';
    const primary = lang === 'ar' ? status.descriptionAr : status.descriptionEn;
    return (primary ?? status.description ?? '').trim();
  }

  /** Locale-aware short date (`Jan 05, 2026` / `05 يناير 2026`). Latin digits in both locales. */
  private formatDate(iso: string | undefined | null, lang: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const locale = lang === 'ar' ? 'ar' : 'en-US';
    let fmt = this.dateFormatters.get(locale);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        numberingSystem: 'latn',
      });
      this.dateFormatters.set(locale, fmt);
    }
    return fmt.format(date);
  }
}
