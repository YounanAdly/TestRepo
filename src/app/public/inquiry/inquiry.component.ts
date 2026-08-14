
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, map, startWith } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { FilterDropdownComponent, MONTH_OPTIONS, YEAR_OPTIONS, FilterOption } from '../../shared/components/filter-dropdown/filter-dropdown.component';
import { SuccessAlertModalComponent } from '../../shared/components/success-alert/success-alert-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { InquiryApi } from '../../shared/services/inquiry/inquiry-api.service';
import { InquiryListItem } from '../../shared/services/inquiry/inquiry.types';
import { SeoService } from '../../shared/services/seo.service';
import { ToastService } from '../../shared/services/toast.service';

const STATUS_ID_PENDING_CUSTOMER_SERVICE_REVIEW = 961110002;
const STATUS_ID_IN_PROGRESS = 961110004;

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [RouterLink, TranslateModule, SuccessAlertModalComponent, FilterDropdownComponent, SkeletonLoaderComponent, A11yModule],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryComponent {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly inquiryApi = inject(InquiryApi);
  private readonly toast = inject(ToastService);

  /** Reactive locale — re-evaluates on every language switch, drives template re-render. */
  protected readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang || 'en'),
    ),
    { initialValue: this.translate.currentLang || 'en' },
  );

  readonly monthOptions = MONTH_OPTIONS;
  readonly yearOptions = YEAR_OPTIONS;
  readonly attachedFileName = signal('');
  readonly isSubmitSuccessOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly inquiryText = signal('');
  readonly submitReferenceNumber = signal('');
  readonly selectedInquiry = signal<InquiryListItem | null>(null);

  // ── Month / year filter defaults ─────────────────────────────────────────
  private readonly now = new Date();
  private readonly currentMonth = this.now.getMonth() + 1;
  private readonly currentYear = this.now.getFullYear();
  private readonly defaultMonthOption =
    MONTH_OPTIONS.find(o => Number(o.value) === this.currentMonth) ?? MONTH_OPTIONS[0];
  private readonly defaultYearOption =
    YEAR_OPTIONS.find(o => Number(o.value) === this.currentYear) ?? YEAR_OPTIONS[0];

  readonly selectedMonthKey = signal(this.defaultMonthOption.labelKey);
  readonly selectedYearKey = signal(this.defaultYearOption.labelKey);
  protected readonly selectedMonth = signal<number>(Number(this.defaultMonthOption.value));
  protected readonly selectedYear = signal<number>(Number(this.defaultYearOption.value));

  // ── List resource ────────────────────────────────────────────────────────
  protected readonly listResource = this.inquiryApi.list(
    () => ({ month: this.selectedMonth(), year: this.selectedYear() }),
  );
  readonly inquiries = computed(() => this.listResource.value()?.result?.inquiries ?? []);

  // ── Pagination ───────────────────────────────────────────────────────────
  readonly itemsPerPage = 2;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.inquiries().length / this.itemsPerPage)));
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // Clamp current page when data shrinks so user never lands on a non-existent page.
  readonly currentPage = linkedSignal<number, number>({
    source: () => this.totalPages(),
    computation: (total, prev) => Math.min(prev?.value ?? 1, total),
  });

  readonly pagedInquiries = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.inquiries().slice(start, start + this.itemsPerPage);
  });

  constructor() {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setSeo());
    this.destroyRef.onDestroy(() => this.setBodyScrollLocked(false));
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  get attachedFileLabelKey(): string {
    return this.attachedFileName() ? '' : 'inquiryPage.composer.attach';
  }

  formatDate(isoDate: string): string {
    const locale = this.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(isoDate).toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
  }

  isPendingStatus(statusId: number | undefined | null): boolean {
    return (
      statusId === STATUS_ID_PENDING_CUSTOMER_SERVICE_REVIEW ||
      statusId === STATUS_ID_IN_PROGRESS
    );
  }

  statusIconSrc(statusId: number | undefined | null): string {
    return this.isPendingStatus(statusId)
      ? 'assets/images/inquiry-status-pending.svg'
      : 'assets/images/inquiry-status-approved.svg';
  }

  onBack(): void {
    void this.router.navigate(['/', this.currentLang(), 'home']);
  }

  openDetail(item: InquiryListItem): void {
    this.selectedInquiry.set(item);
    this.setBodyScrollLocked(true);
  }

  closeDetail(): void {
    this.selectedInquiry.set(null);
    this.setBodyScrollLocked(false);
  }

  onMonthChange(option: FilterOption): void {
    this.selectedMonthKey.set(option.labelKey);
    this.selectedMonth.set(Number(option.value));
  }

  onYearChange(option: FilterOption): void {
    this.selectedYearKey.set(option.labelKey);
    this.selectedYear.set(Number(option.value));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachedFileName.set(input.files?.item(0)?.name ?? '');
  }

  onInquiryTextChange(event: Event): void {
    this.inquiryText.set((event.target as HTMLTextAreaElement).value);
  }

  onSubmitInquiry(): void {
    const text = this.inquiryText().trim();
    if (!text || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.inquiryApi
      .submit({ inquiry: text })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          if (response.isSuccess) {
            this.submitReferenceNumber.set(response.result?.name ?? '');
            this.openSubmitSuccessAlert();
            return;
          }
          this.toast.error(
            'inquiryPage.errors.submitFailedTitle',
            'inquiryPage.errors.submitFailedDetail',
            response,
          );
        },
        error: () => undefined,
      });
  }

  onSubmitSuccessDone(): void {
    this.closeSubmitSuccessAlert();
  }

  onSubmitSuccessClose(): void {
    this.closeSubmitSuccessAlert();
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('inquiryPage.seo.title'),
      description: this.translate.instant('inquiryPage.seo.description'),
      keywords: this.translate.instant('inquiryPage.seo.keywords'),
      url: this.translate.instant('inquiryPage.seo.url'),
      author: this.translate.instant('inquiryPage.seo.author'),
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
    if (isPlatformBrowser(this.platformId)) {
      window.location.reload();
    }
  }

  private scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.style.overflow = locked ? 'hidden' : '';
  }

}
