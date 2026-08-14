
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterDropdownComponent, MONTH_OPTIONS, YEAR_OPTIONS, FilterOption } from '../../shared/components/filter-dropdown/filter-dropdown.component';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';

type PaymentStatus = 'approved' | 'pending';
type RequestStatus = 'approved' | 'pending' | 'rejected';
type RequestTab = 'services' | 'complaints' | 'inquiries' | 'payments';

interface PaymentRow {
  id: number;
  refNo: string;
  date: string;
  billNo: string;
  amount: string;
  method: string;
  status: PaymentStatus;
  hasDownload: boolean;
}

interface RequestRow {
  id: number;
  requestNo: string;
  requestNameKey: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
}

interface QuickActionItem {
  id: number;
  iconSrc: string;
  titleKey: string;
  descriptionKey: string;
  status: RequestStatus;
  time: string;
}

interface RecentSubmissionItem {
  id: number;
  titleKey: string;
  descriptionKey: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, FilterDropdownComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  selectedMonthKey = 'filterDropdown.months.january';
  selectedYearKey = 'filterDropdown.years.y2026';
  readonly monthOptions = MONTH_OPTIONS;
  readonly yearOptions = YEAR_OPTIONS;
  activeTab: RequestTab = 'services';

  readonly duePayments: PaymentRow[] = [
    {
      id: 1,
      refNo: 'NFZ12345677',
      date: '03/02/2027',
      billNo: '2345',
      amount: '23 OMR',
      method: 'Visa',
      status: 'approved',
      hasDownload: true,
    },
    {
      id: 2,
      refNo: 'NFZ12345677',
      date: '03/02/2027',
      billNo: '3456',
      amount: '66 OMR',
      method: 'Visa',
      status: 'pending',
      hasDownload: false,
    },
    {
      id: 3,
      refNo: 'NFZ12345677',
      date: '03/02/2027',
      billNo: '3456',
      amount: '66 OMR',
      method: 'Visa',
      status: 'approved',
      hasDownload: true,
    },
  ];

  readonly myRequests: RequestRow[] = [
    {
      id: 1,
      requestNo: 'NFZ12345677',
      requestNameKey: 'dashboardPage.myRequests.rows.r1.requestName',
      startDate: '03/02/2026',
      endDate: '03/02/2027',
      status: 'rejected',
    },
    {
      id: 2,
      requestNo: 'NFZ12345677',
      requestNameKey: 'dashboardPage.myRequests.rows.r2.requestName',
      startDate: '03/02/2026',
      endDate: '03/02/2027',
      status: 'approved',
    },
    {
      id: 3,
      requestNo: 'NFZ12345677',
      requestNameKey: 'dashboardPage.myRequests.rows.r3.requestName',
      startDate: '03/02/2026',
      endDate: '03/02/2027',
      status: 'pending',
    },
    {
      id: 4,
      requestNo: 'NFZ12345677',
      requestNameKey: 'dashboardPage.myRequests.rows.r4.requestName',
      startDate: '03/02/2026',
      endDate: '03/02/2027',
      status: 'pending',
    },
  ];

  readonly quickActions: QuickActionItem[] = [
    {
      id: 1,
      iconSrc: 'assets/images/dashboard-quick-warning.svg',
      titleKey: 'dashboardPage.quickActions.items.i1.title',
      descriptionKey: 'dashboardPage.quickActions.items.i1.description',
      status: 'rejected',
      time: '10:30 AM',
    },
    {
      id: 2,
      iconSrc: 'assets/images/dashboard-quick-reminder.svg',
      titleKey: 'dashboardPage.quickActions.items.i2.title',
      descriptionKey: 'dashboardPage.quickActions.items.i2.description',
      status: 'pending',
      time: '10:30 AM',
    },
    {
      id: 3,
      iconSrc: 'assets/images/dashboard-quick-success.svg',
      titleKey: 'dashboardPage.quickActions.items.i3.title',
      descriptionKey: 'dashboardPage.quickActions.items.i3.description',
      status: 'approved',
      time: '10:30 AM',
    },
  ];

  readonly recentSubmissions: RecentSubmissionItem[] = [
    {
      id: 1,
      titleKey: 'dashboardPage.recentSubmittedServices.items.i1.title',
      descriptionKey: 'dashboardPage.recentSubmittedServices.items.i1.description',
      route: 'inquiry',
    },
    {
      id: 2,
      titleKey: 'dashboardPage.recentSubmittedServices.items.i2.title',
      descriptionKey: 'dashboardPage.recentSubmittedServices.items.i2.description',
      route: 'services',
    },
    {
      id: 3,
      titleKey: 'dashboardPage.recentSubmittedServices.items.i3.title',
      descriptionKey: 'dashboardPage.recentSubmittedServices.items.i3.description',
      route: 'complaint-request',
    },
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

  get localizedHomeRoute(): string[] {
    return ['/', this.currentLang, 'home'];
  }

  onSelectTab(tab: RequestTab): void {
    this.activeTab = tab;
  }

  onMonthChange(option: FilterOption): void {
    this.selectedMonthKey = option.labelKey;
  }

  onYearChange(option: FilterOption): void {
    this.selectedYearKey = option.labelKey;
  }

  onOpenSubmission(item: RecentSubmissionItem): void {
    void this.router.navigate(['/', this.currentLang, item.route]);
  }

  onViewRef(refNo: string, titleKey = 'requestDetailsPage.summary.serviceTitle'): void {
    void this.router.navigate(['/', this.currentLang, 'request-details'], {
      queryParams: { ref: refNo, titleKey },
    });
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('dashboardPage.seo.title'),
      description: this.translate.instant('dashboardPage.seo.description'),
      keywords: this.translate.instant('dashboardPage.seo.keywords'),
      url: this.translate.instant('dashboardPage.seo.url'),
      author: this.translate.instant('dashboardPage.seo.author'),
      type: 'website',
    });
  }
}
