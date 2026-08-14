import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import {
  FilterDropdownComponent,
  FilterOption,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
} from '../../shared/components/filter-dropdown/filter-dropdown.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { ProfileApi } from '../../shared/services/profile/profile-api.service';
import { Invoice, InvoiceStatusCode } from '../../shared/services/profile/profile.types';

/** Bill row status displayed in the table and filter dropdown. */
type BillStatus = 'pending' | 'paid' | 'overdue';

/** Active tab in the bills card. */
type BillsTab = 'pending' | 'paid';

/** Which stat card is being rendered — controls colour + icon. */
type BillStatKind = 'total' | 'paid' | 'pending' | 'overdue';

interface BillStatCard {
  kind: BillStatKind;
  labelKey: string;
  value: number;
  iconSrc: string;
}

interface BillRow {
  id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billAccountNumber: string;
  amount: string;
  /** Raw numeric amount used for the "N Bills selected" total in the pending tab. */
  amountValue: number;
  status: BillStatus;
}

/**
 * View Bills page (`/:lang/view-bills`).
 *
 * Opened from the "View Bills" quick-action card on `my-profile`.
 * Matches the Figma "Bill List" screen (node 14795-39912):
 * breadcrumb + hero + 4 stat cards + filter row (search / status / month /
 * year / reset) + bill table with per-row Pay Now action + pagination.
 *
 * Data is currently seeded from a Figma-aligned mock. When the bills endpoint
 * lands, swap `MOCK_BILLS` for an `httpResource()` keyed on the active filter
 * signals — the template already reacts to `visibleBills()` / `pagedBills()`.
 */
@Component({
  selector: 'app-view-bills',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, FilterDropdownComponent, SkeletonLoaderComponent],
  templateUrl: './view-bills.component.html',
  styleUrl: './view-bills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewBillsComponent {
  /** Billing account id from `?account=…` — auto-bound via `withComponentInputBinding()`. */
  readonly account = input<string>('');

  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileApi = inject(ProfileApi);

  private readonly currentLangSignal = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang || 'en'),
    ),
    { initialValue: this.translate.currentLang || 'en' },
  );

  readonly currentLang = computed(() => this.currentLangSignal() || 'en');
  readonly localizedHomeRoute = computed(() => ['/', this.currentLang(), 'home']);
  readonly localizedDashboardRoute = computed(() => ['/', this.currentLang(), 'dashboard']);

  // Placeholder keys shown in dropdown pills until the user picks a value.
  readonly accountPlaceholderKey = 'viewBills.filters.accountPlaceholder';
  readonly monthPlaceholderKey = 'filterDropdown.placeholder.month';
  readonly yearPlaceholderKey = 'filterDropdown.placeholder.year';

  readonly monthOptions = MONTH_OPTIONS;
  readonly yearOptions = YEAR_OPTIONS;

  // ── Tabs ───────────────────────────────────────────────────────────────────

  /** Active tab in the bills card. Defaults to "pending" since that's the actionable view. */
  readonly activeTab = signal<BillsTab>('pending');

  // Filter state — empty string means "no filter applied".
  readonly searchTerm = signal('');
  readonly selectedMonth = signal('');
  readonly selectedYear = signal('');

  /**
   * Debounced view of `searchTerm` — the API resources depend on this so we
   * don't fire a request on every keystroke. 300ms is long enough for typing
   * to settle but short enough to feel snappy.
   */
  readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  /**
   * Label keys currently displayed by each filter dropdown. Empty strings
   * cause `FilterDropdownComponent` to fall back to its placeholder key —
   * that behaviour is how `resetFilters()` restores the placeholders.
   */
  readonly selectedMonthLabel = computed<string>(() => {
    const month = this.selectedMonth();
    if (!month) {
      return '';
    }
    return this.monthOptions.find((o) => o.value === month)?.labelKey ?? '';
  });

  readonly selectedYearLabel = computed<string>(() => {
    const year = this.selectedYear();
    if (!year) {
      return '';
    }
    return this.yearOptions.find((o) => o.value === year)?.labelKey ?? '';
  });

  // ── Billing account dropdown ───────────────────────────────────────────────

  /**
   * Reactive list of billing accounts — populates the "Select Account"
   * dropdown so the user can switch between accounts without navigating back.
   */
  readonly billingAccountsResource = this.profileApi.billingAccounts();

  /** Dropdown options built from the billing accounts API. */
  readonly billingAccountOptions = computed<FilterOption[]>(() => {
    const items = this.billingAccountsResource.value()?.result ?? [];
    return items.map((acc) => ({
      // `labelKey` is passed through `translate` pipe — plain strings fall
      // through unchanged when no translation entry exists, so the account
      // name renders as-is in both locales.
      labelKey: acc.name || acc.accountId,
      value: acc.accountId,
    }));
  });

  /**
   * Currently selected billing account id. Seeded from the `?account=` query
   * param via `linkedSignal`, but the user can override by picking a
   * different option from the dropdown — router.navigate then syncs the URL.
   */
  readonly selectedAccountId = linkedSignal<string, string>({
    source: () => this.account() || '',
    computation: (incoming, prev) => incoming || prev?.value || '',
  });

  /** Label shown on the account dropdown trigger — the currently selected account name. */
  readonly selectedAccountLabel = computed<string>(() => {
    const id = this.selectedAccountId();
    if (!id) return '';
    return this.billingAccountOptions().find((o) => o.value === id)?.labelKey ?? '';
  });

  /**
   * When the page is opened from account-summary the URL carries `?account=…`,
   * meaning the billing account is fixed for this visit and the user should
   * not be able to switch it. The dropdown renders in a dimmed / non-interactive
   * state whenever the input signal has a value.
   */
  readonly isAccountLocked = computed<boolean>(() => !!this.account()?.trim());

  // ── API resources (all server-driven filtering) ──────────────────────────
  //
  // The backend accepts comma-separated `statusCode` values. The pending tab
  // shows both pending and overdue rows, so we fire two resources:
  //   - `paidResource`          — statusCode = Paid,           server-paginated.
  //   - `pendingOverdueResource` — statusCode = Pending,Overdue, large pageSize.
  //
  // `search`, `month`, `year` always ride on the query string so the client
  // never re-filters locally. Each resource stays idle while `accountId`
  // is empty.

  /** Large pageSize used for the pending tab (single call for pending + overdue). */
  private readonly PENDING_MERGE_PAGE_SIZE = 200;

  /** Real page size shown to the user — governs the pagination footer. */
  readonly pageSize = 10;

  /** Currently active page (1-based) — sent to the paid endpoint, sliced client-side on pending. */
  readonly currentPage = linkedSignal<
    { tab: BillsTab; account: string; search: string; month: string; year: string },
    number
  >({
    // Any filter or account/tab change resets us back to page 1.
    source: () => ({
      tab: this.activeTab(),
      account: this.selectedAccountId(),
      search: this.debouncedSearchTerm(),
      month: this.selectedMonth(),
      year: this.selectedYear(),
    }),
    computation: () => 1,
  });

  /** Numeric versions of month/year (1-based) that the backend expects. */
  private readonly monthAsNumber = computed<number | null>(() => {
    const raw = this.selectedMonth();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  private readonly yearAsNumber = computed<number | null>(() => {
    const raw = this.selectedYear();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  /** Paid invoices — real server pagination (page = current, pageSize = 10). */
  readonly paidResource = this.profileApi.invoices(() => ({
    accountId: this.selectedAccountId() || null,
    // When we're not on the paid tab we still fetch page 1 just for the
    // `totalCount` used by the tab label — the rows themselves are ignored.
    page: this.activeTab() === 'paid' ? this.currentPage() : 1,
    pageSize: this.pageSize,
    statusCode: String(InvoiceStatusCode.Paid),
    month: this.monthAsNumber(),
    year: this.yearAsNumber(),
    search: this.debouncedSearchTerm() || null,
  }));

  /** Pending + Overdue invoices in a single call (comma-separated status codes). */
  readonly pendingOverdueResource = this.profileApi.invoices(() => ({
    accountId: this.selectedAccountId() || null,
    page: 1,
    pageSize: this.PENDING_MERGE_PAGE_SIZE,
    statusCode: `${InvoiceStatusCode.Pending},${InvoiceStatusCode.Overdue}`,
    month: this.monthAsNumber(),
    year: this.yearAsNumber(),
    search: this.debouncedSearchTerm() || null,
  }));

  /** Loading state for the currently visible tab. */
  readonly isLoading = computed(() => {
    if (this.activeTab() === 'paid') {
      return this.paidResource.isLoading();
    }
    return this.pendingOverdueResource.isLoading();
  });

  /** Error state for the currently visible tab. */
  readonly hasError = computed(() => {
    if (this.activeTab() === 'paid') {
      return !!this.paidResource.error();
    }
    return !!this.pendingOverdueResource.error();
  });

  /** All paid invoices for the current server-paginated page. */
  private readonly paidBills = computed<BillRow[]>(() => {
    const items = this.paidResource.value()?.result?.items ?? [];
    return items.map((inv) => mapInvoiceToBillRow(inv, this.selectedAccountId()));
  });

  /**
   * Pending + overdue invoices from a single API call.
   * Sorted by `billDate` descending so the newest bills sit at the top.
   */
  private readonly pendingBills = computed<BillRow[]>(() => {
    const items = this.pendingOverdueResource.value()?.result?.items ?? [];
    const sorted = [...items].sort((a, b) =>
      (b.billDate || '').localeCompare(a.billDate || ''),
    );
    return sorted.map((inv) => mapInvoiceToBillRow(inv, this.selectedAccountId()));
  });

  /** Tab-label counts — read straight off the envelopes' `totalCount`. */
  readonly paidCount = computed(() => this.paidResource.value()?.result?.totalCount ?? 0);
  readonly pendingCount = computed(() =>
    this.pendingOverdueResource.value()?.result?.totalCount ?? 0,
  );

  /** Stat counters computed off the resource envelopes. */
  readonly statCards = computed<BillStatCard[]>(() => {
    const paid = this.paidCount();
    const items = this.pendingOverdueResource.value()?.result?.items ?? [];
    const pending = items.filter((inv) => inv.statusCode === InvoiceStatusCode.Pending).length;
    const overdue = items.filter((inv) => inv.statusCode === InvoiceStatusCode.Overdue).length;
    return [
      {
        kind: 'total',
        labelKey: 'viewBills.stats.total',
        value: paid + pending + overdue,
        iconSrc: 'assets/images/profile-bills-total.svg',
      },
      {
        kind: 'paid',
        labelKey: 'viewBills.stats.paid',
        value: paid,
        iconSrc: 'assets/images/profile-bills-paid.svg',
      },
      {
        kind: 'pending',
        labelKey: 'viewBills.stats.pending',
        value: pending,
        iconSrc: 'assets/images/profile-bills-pending.svg',
      },
      {
        kind: 'overdue',
        labelKey: 'viewBills.stats.overdue',
        value: overdue,
        iconSrc: 'assets/images/profile-bills-overdue.svg',
      },
    ];
  });

  // ── Pagination (per-tab logic) ─────────────────────────────────────────────

  /** Total number of items across all pages for the *current* tab. */
  readonly visibleTotal = computed(() =>
    this.activeTab() === 'paid' ? this.paidCount() : this.pendingCount(),
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleTotal() / this.pageSize)),
  );

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  /**
   * Rows shown for the current tab + page.
   * - Paid tab: server already paginated the response, use as-is.
   * - Pending tab: client-slice the merged pending+overdue list.
   */
  readonly pagedBills = computed<BillRow[]>(() => {
    if (this.activeTab() === 'paid') {
      return this.paidBills();
    }
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.pendingBills().slice(start, start + this.pageSize);
  });

  readonly rangeStart = computed(() =>
    this.visibleTotal() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.visibleTotal()),
  );

  // ── Multi-select (pending tab only) ────────────────────────────────────────

  /**
   * Set of invoice ids currently checked in the pending tab. Kept as a
   * plain `Set` inside a signal for O(1) toggle / lookup during render.
   * Cleared automatically whenever the active tab or account changes.
   */
  readonly selectedBillIds = linkedSignal<{ tab: BillsTab; account: string }, Set<string>>({
    source: () => ({ tab: this.activeTab(), account: this.selectedAccountId() }),
    computation: () => new Set<string>(),
  });

  /** Rows in the pending tab currently marked for payment. */
  readonly selectedBills = computed<BillRow[]>(() => {
    const ids = this.selectedBillIds();
    return this.pendingBills().filter((row) => ids.has(row.id));
  });

  readonly selectedCount = computed(() => this.selectedBills().length);

  /** OMR total of selected bills — used by the sticky payment bar. */
  readonly selectedTotal = computed(() =>
    this.selectedBills().reduce((sum, row) => sum + row.amountValue, 0),
  );

  readonly selectedTotalDisplay = computed(() => this.selectedTotal().toFixed(3));

  ngOnInit(): void {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setSeo());
  }

  onBack(): void {
    void this.router.navigate(['/', this.currentLang(), 'my-profile']);
  }

  onTabChange(tab: BillsTab): void {
    this.activeTab.set(tab);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onAccountChange(option: FilterOption): void {
    const id = option.value;
    if (!id || id === this.selectedAccountId()) return;
    this.selectedAccountId.set(id);
    // Keep the URL in sync so a refresh preserves the selected account.
    void this.router.navigate([], {
      queryParams: { account: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onMonthChange(option: FilterOption): void {
    this.selectedMonth.set(option.value);
  }

  onYearChange(option: FilterOption): void {
    this.selectedYear.set(option.value);
  }

  /** Clears every filter and forces the dropdowns to re-show placeholders. */
  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedMonth.set('');
    this.selectedYear.set('');
  }

  isBillSelected(row: BillRow): boolean {
    return this.selectedBillIds().has(row.id);
  }

  toggleBillSelection(row: BillRow): void {
    this.selectedBillIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) {
        next.delete(row.id);
      } else {
        next.add(row.id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedBillIds.set(new Set<string>());
  }

  /** Retry the resources backing the currently visible tab. */
  retryFetch(): void {
    if (this.activeTab() === 'paid') {
      this.paidResource.reload();
      return;
    }
    this.pendingOverdueResource.reload();
  }

  onPaySelectedBills(): void {
    if (this.selectedCount() === 0) return;
    // Placeholder: navigate to a future payments flow. Once the payments
    // endpoint is wired, swap this for a service call that returns a
    // redirect / payment intent.
    const bills = this.selectedBills().map((row) => row.id).join(',');
    void this.router.navigate(['/', this.currentLang(), 'dashboard'], {
      queryParams: { bills },
    });
  }

  onDownloadBill(row: BillRow): void {
    // Placeholder for the invoice-download flow. The backend endpoint that
    // streams the PDF isn't wired yet — once it lands, swap this for a call
    // that returns a `Blob` and triggers a browser download. Kept as a no-op
    // (with a debug hook) so the click still feels responsive.
    void row;
  }

  onViewBill(row: BillRow): void {
    // Placeholder detail navigation — hook up to the bill detail route when
    // it lands. Falls back to dashboard so nothing 404s in the meantime.
    void this.router.navigate(['/', this.currentLang(), 'dashboard'], {
      queryParams: { bill: row.billNumber },
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  trackByPage(_index: number, page: number): number {
    return page;
  }

  trackByBill(_index: number, row: BillRow): string {
    return row.id;
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('viewBills.seo.title'),
      description: this.translate.instant('viewBills.seo.description'),
      keywords: this.translate.instant('viewBills.seo.keywords'),
      url: this.translate.instant('viewBills.seo.url'),
      author: this.translate.instant('viewBills.seo.author'),
      type: 'website',
    });
  }
}

/**
 * Maps an API `Invoice` to the display `BillRow` shape used by the table.
 * StatusCode enum mapping — see `InvoiceStatusCode` for the CRM option-set ids.
 */
function mapInvoiceToBillRow(inv: Invoice, accountId: string): BillRow {
  const billDate = formatDate(inv.billDate);
  const dueDate = inv.dueDate ? formatDate(inv.dueDate) : billDate;

  let status: BillStatus;
  switch (inv.statusCode) {
    case InvoiceStatusCode.Paid:
      status = 'paid';
      break;
    case InvoiceStatusCode.Overdue:
      status = 'overdue';
      break;
    case InvoiceStatusCode.Pending:
    default:
      status = 'pending';
      break;
  }

  return {
    id: inv.invoiceId,
    billNumber: inv.name,
    billDate,
    dueDate,
    billAccountNumber: accountId,
    amount: inv.totalAmount.toFixed(3),
    amountValue: inv.totalAmount,
    status,
  };
}

/** Formats an ISO date string as `DD/MM/YYYY` in UTC. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getUTCFullYear());
  return `${dd}/${mm}/${yyyy}`;
}
