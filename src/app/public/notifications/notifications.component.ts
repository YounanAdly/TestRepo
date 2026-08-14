import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterDropdownComponent, MONTH_OPTIONS, YEAR_OPTIONS, FilterOption } from '../../shared/components/filter-dropdown/filter-dropdown.component';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';

type NotificationTone = 'info' | 'warning' | 'success' | 'danger';

interface NotificationItem {
  id: number;
  tone: NotificationTone;
  iconSrc: string;
  titleKey: string;
  descriptionKey: string;
  timeKey: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, FilterDropdownComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  selectedMonthKey = 'filterDropdown.months.january';
  selectedYearKey = 'filterDropdown.years.y2026';
  readonly monthOptions = MONTH_OPTIONS;
  readonly yearOptions = YEAR_OPTIONS;

  readonly notifications: NotificationItem[] = [
    {
      id: 1,
      tone: 'info',
      iconSrc: 'assets/images/notification-icon-invoice.svg',
      titleKey: 'notificationsPage.list.invoice.title',
      descriptionKey: 'notificationsPage.list.invoice.description',
      timeKey: 'notificationsPage.list.invoice.time',
    },
    {
      id: 2,
      tone: 'warning',
      iconSrc: 'assets/images/notification-icon-reminder.svg',
      titleKey: 'notificationsPage.list.reminder.title',
      descriptionKey: 'notificationsPage.list.reminder.description',
      timeKey: 'notificationsPage.list.reminder.time',
    },
    {
      id: 3,
      tone: 'success',
      iconSrc: 'assets/images/notification-icon-success.svg',
      titleKey: 'notificationsPage.list.serviceCompleted.title',
      descriptionKey: 'notificationsPage.list.serviceCompleted.description',
      timeKey: 'notificationsPage.list.serviceCompleted.time',
    },
    {
      id: 4,
      tone: 'danger',
      iconSrc: 'assets/images/notification-icon-warning.svg',
      titleKey: 'notificationsPage.list.disconnectionWarning.title',
      descriptionKey: 'notificationsPage.list.disconnectionWarning.description',
      timeKey: 'notificationsPage.list.disconnectionWarning.time',
    },
    {
      id: 5,
      tone: 'success',
      iconSrc: 'assets/images/notification-icon-success.svg',
      titleKey: 'notificationsPage.list.paymentSuccess.title',
      descriptionKey: 'notificationsPage.list.paymentSuccess.description',
      timeKey: 'notificationsPage.list.paymentSuccess.time',
    },
  ];

  readonly pageSize = 2;
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.notifications.length / this.pageSize));
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  ngOnInit(): void {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setSeo());
  }

  onBack(): void {
    void this.router.navigate(['/', this.currentLang, 'home']);
  }

  onMonthChange(option: FilterOption): void {
    this.selectedMonthKey = option.labelKey;
  }

  onYearChange(option: FilterOption): void {
    this.selectedYearKey = option.labelKey;
  }

  trackById(_index: number, item: NotificationItem): number {
    return item.id;
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('notificationsPage.seo.title'),
      description: this.translate.instant('notificationsPage.seo.description'),
      keywords: this.translate.instant('notificationsPage.seo.keywords'),
      url: this.translate.instant('notificationsPage.seo.url'),
      author: this.translate.instant('notificationsPage.seo.author'),
      type: 'website',
    });
  }
}
