import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, PLATFORM_ID, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { AuthService } from '../../shared/services/auth.service';
import { HomePageApi } from '../../shared/services/home-page/home-page-api.service';
import { HomePageAboutValue, HomePageBannerItem, HomePageServiceItem } from '../../shared/services/home-page/home-page.types';
import { ServiceOfferingCardComponent } from '../../shared/components/service-offering-card/service-offering-card.component';
import { MediaCenterSectionComponent } from '../../shared/components/media-center-section/media-center-section.component';
import { FaqSectionComponent } from '../../shared/components/faq-section/faq-section.component';
import { RegulationsSectionComponent } from '../../shared/components/regulations-section/regulations-section.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ProfileAccount as DropdownProfileAccount, ProfileDropdownComponent } from '../../shared/components/profile-dropdown/profile-dropdown.component';
import { ProfileApi } from '../../shared/services/profile/profile-api.service';
import { ProfileAccount as ApiProfileAccount } from '../../shared/services/profile/profile.types';
import { ToastService } from '../../shared/services/toast.service';
import {
  AddAccountFormValue,
  AddAccountModalComponent,
  mapAddAccountFormToPayload,
} from '../../shared/components/add-account-modal/add-account-modal.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ServiceOfferingCardComponent, MediaCenterSectionComponent, FaqSectionComponent, SkeletonLoaderComponent, ProfileDropdownComponent, AddAccountModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  readonly regulationsSectionComponent = RegulationsSectionComponent;
  public currentLang = 'en';
  public languageService = inject(LanguageService);
  private readonly homePageApi = inject(HomePageApi);
  private readonly profileApi = inject(ProfileApi);

  /** Signal mirror of `currentLang` so signal-derived computeds re-evaluate on language switch under OnPush. */
  private readonly currentLangSig = signal<string>('en');

  /** Reactive read of `/api/v1/home-page/about-us`. */
  protected readonly aboutResource = this.homePageApi.aboutUs();

  /** Reactive read of `/api/v1/home-page/banner` (hero banner). */
  protected readonly bannerResource = this.homePageApi.banner();

  /** Reactive read of `/api/v1/home-page/services`. */
  protected readonly servicesResource = this.homePageApi.services();

  /**
   * Hero title split into accent / plain / accent chunks for the existing
   * `.hero-title` flex layout. Returns `null` while loading or on error so
   * the template falls back to the translated `home.hero.title.*` keys.
   */
  protected readonly heroTitleParts = computed<{ first: string; middle: string; last: string } | null>(() => {
    const banner: HomePageBannerItem | undefined = this.bannerResource.value()?.result?.[0];
    if (!banner) return null;
    const raw = (this.currentLangSig() === 'ar' ? banner.titleAr : banner.titleEn) ?? '';
    const title = raw.trim();
    if (!title) return null;
    const words = title.split(/\s+/);
    if (words.length === 1) return { first: words[0], middle: '', last: '' };
    if (words.length === 2) return { first: words[0], middle: '', last: words[1] };
    return { first: words[0], middle: words.slice(1, -1).join(' '), last: words[words.length - 1] };
  });

  /** Sorted "Who We Are" value cards (1-based `order`). */
  protected readonly aboutValues = computed<HomePageAboutValue[]>(() => {
    const values = this.aboutResource.value()?.result?.values ?? [];
    return [...values].sort((a, b) => Number(a.order) - Number(b.order));
  });

  /** First value renders in the large primary card. */
  protected readonly aboutMain = computed<HomePageAboutValue | null>(
    () => this.aboutValues()[0] ?? null,
  );

  /** Remaining values render in the two side cards. */
  protected readonly aboutSide = computed<HomePageAboutValue[]>(
    () => this.aboutValues().slice(1),
  );

  /** Language-matched title for a single value (falls back to EN). */
  protected aboutTitle(value: HomePageAboutValue | null | undefined): string {
    if (!value) return '';
    return this.currentLangSig() === 'ar' ? value.titleAr : value.titleEn;
  }

  /** Language-matched body for a single value (falls back to EN). */
  protected aboutBody(value: HomePageAboutValue | null | undefined): string {
    if (!value) return '';
    return this.currentLangSig() === 'ar' ? value.descriptionAr : value.descriptionEn;
  }

  /** Language-matched services section title from the CMS. */
  protected readonly servicesSectionTitle = computed<string>(() => {
    const result = this.servicesResource.value()?.result;
    if (!result) return '';
    return this.currentLangSig() === 'ar' ? result.titleAr : result.titleEn;
  });

  /** Language-matched services section description from the CMS. */
  protected readonly servicesSectionDesc = computed<string>(() => {
    const result = this.servicesResource.value()?.result;
    if (!result) return '';
    return this.currentLangSig() === 'ar' ? result.descriptionAr : result.descriptionEn;
  });

  /** Services cards mapped to display shape, language-reactive. */
  protected readonly serviceDisplayItems = computed(() => {
    const items: HomePageServiceItem[] = this.servicesResource.value()?.result?.services ?? [];
    const isAr = this.currentLangSig() === 'ar';
    return items.map(s => ({
      serviceId: s.serviceId,
      title: isAr ? s.titleAr : s.titleEn,
      description: isAr ? s.descriptionAr : s.descriptionEn,
      imageSrc: s.icon ? `data:image/png;base64,${s.icon}` : 'assets/images/image-placeholder.png',
      imageAlt: isAr ? s.titleAr : s.titleEn,
    }));
  });

  private seo = inject(SeoService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get userInitials(): string {
    return 'U';
  }

  isSidebarOpen = false;
  private readonly profileAccountsResource = this.profileApi.accounts(() => this.authService.isAuthenticated());

  protected readonly profileAccounts = computed<DropdownProfileAccount[]>(() => {
    const rows = this.profileAccountsResource.value()?.result ?? [];
    return rows.map((row) => this.toDropdownAccount(row));
  });

  protected readonly activeAccount = signal<string | null>(this.authService.getSelectedAccountId());
  readonly isAddAccountOpen = signal(false);
  readonly isAddAccountSubmitting = signal(false);

  onAccountSelected(account: DropdownProfileAccount): void {
    this.activeAccount.set(account.id);
    this.authService.setSelectedAccountId(account.id);
  }

  onOpenAddAccount(): void {
    this.isAddAccountOpen.set(true);
  }

  onAddAccountClosed(): void {
    this.isAddAccountOpen.set(false);
  }

  onAddAccountCreated(value: AddAccountFormValue): void {
    if (this.isAddAccountSubmitting()) {
      return;
    }
    this.isAddAccountSubmitting.set(true);
    this.profileApi.createAccount(mapAddAccountFormToPayload(value))
      .pipe(
        finalize(() => this.isAddAccountSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (envelope) => {
          if (!envelope.isSuccess) {
            this.toast.error(
              'myProfile.addAccountModal.failedTitle',
              'myProfile.addAccountModal.failedDetail',
              envelope,
            );
            return;
          }
          this.toast.success(
            'myProfile.addAccountModal.successTitle',
            'myProfile.addAccountModal.successDetail',
          );
          this.profileAccountsResource.reload();
          this.isAddAccountOpen.set(false);
        },
        // Transport errors (5xx / 0 / 503 / timeout) are toasted by errorInterceptor.
        error: () => { /* no-op */ },
      });
  }

  private toDropdownAccount(account: ApiProfileAccount): DropdownProfileAccount {
    const isCompany = account.accountType === 2 || account.accountType === '2';
    return {
      id: account.accountId,
      name: account.name,
      typeLabelKey: isCompany ? 'header.actions.companyAccount' : 'header.actions.personalAccount',
      avatarInitials: computeInitials(account.name),
    };
  }

  goToProfile(): void {
    void this.router.navigate(['/', this.currentLang, 'my-profile']);
  }

  openSidebar(): void {
    this.isSidebarOpen = true;
    if (!this.isBrowser) return;
    document.body.style.overflow = 'hidden';
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    if (!this.isBrowser) return;
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.authService.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.closeSidebar();
    void this.router.navigate(['/', this.currentLang, 'login']);
  }

  goToNotifications(): void {
    void this.router.navigate(['/', this.currentLang, 'notifications']);
  }

  // ── Services carousel state ──────────────────────────────────────────────
  atStart = true;
  atEnd = false;
  private readonly CARD_SCROLL = 288; // 268px card + 20px gap

  private readonly servicesTrackRef = viewChild.required<ElementRef<HTMLElement>>('servicesTrack');

  readonly serviceItems = [
    {
      slug: 'connection',
      titleKey: 'home.services.cards.connection.title',
      descriptionKey: 'home.services.cards.connection.description',
      imageSrc: 'assets/images/image-placeholder.png',
      imageAltKey: 'home.services.cards.connection.imageAlt',
    },
    {
      slug: 'tanker',
      titleKey: 'home.services.cards.tanker.title',
      descriptionKey: 'home.services.cards.tanker.description',
      imageSrc: 'assets/images/image-placeholder2.png',
      imageAltKey: 'home.services.cards.tanker.imageAlt',
    },
    {
      slug: 'meter',
      titleKey: 'home.services.cards.meter.title',
      descriptionKey: 'home.services.cards.meter.description',
      imageSrc: 'assets/images/image-placeholder3.png',
      imageAltKey: 'home.services.cards.meter.imageAlt',
    },
    {
      slug: 'disconnection',
      titleKey: 'home.services.cards.disconnection.title',
      descriptionKey: 'home.services.cards.disconnection.description',
      imageSrc: 'assets/images/image-placeholder4.png',
      imageAltKey: 'home.services.cards.disconnection.imageAlt',
    },
     {
      slug: 'connection',
      titleKey: 'home.services.cards.connection.title',
      descriptionKey: 'home.services.cards.connection.description',
      imageSrc: 'assets/images/image-placeholder.png',
      imageAltKey: 'home.services.cards.connection.imageAlt',
    },
     {
      slug: 'tanker',
      titleKey: 'home.services.cards.tanker.title',
      descriptionKey: 'home.services.cards.tanker.description',
      imageSrc: 'assets/images/image-placeholder2.png',
      imageAltKey: 'home.services.cards.tanker.imageAlt',
    },
    {
      slug: 'meter',
      titleKey: 'home.services.cards.meter.title',
      descriptionKey: 'home.services.cards.meter.description',
      imageSrc: 'assets/images/image-placeholder3.png',
      imageAltKey: 'home.services.cards.meter.imageAlt',
    }
  ];

  selectedComplaint: string | null = null;

  selectComplaint(type: string): void {
    this.selectedComplaint = this.selectedComplaint === type ? null : type;
  }

  readonly complaintItems = [
     {
      type: 'waterQuality',
      titleKey: 'home.complaints.cards.waterQuality.title',
      descriptionKey: 'home.complaints.cards.waterQuality.description',
      imageSrc: 'assets/images/complaint-water-leakage.png',
      imageAltKey: 'home.complaints.cards.waterLeakage.imageAlt',
      surfaceClass: 'complaint-card-cool',
    },
    {
      type: 'waterLeakage',
      titleKey: 'home.complaints.cards.waterLeakage.title',
      descriptionKey: 'home.complaints.cards.waterLeakage.description',
      imageSrc: 'assets/images/complaint-water-quality.png',
      imageAltKey: 'home.complaints.cards.waterQuality.imageAlt',
      surfaceClass: 'complaint-card-warm',
    },
    {
      type: 'general',
      titleKey: 'complaintsPage.cards.general.title',
      descriptionKey: 'home.complaints.cards.general.description',
      imageSrc: 'assets/images/complaint-general.png',
      imageAltKey: 'home.complaints.cards.general.imageAlt',
      surfaceClass: 'complaint-card-sky',
    },
  ];

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage() || 'en';
    this.currentLangSig.set(this.currentLang);
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLang = event.lang;
        this.currentLangSig.set(event.lang);
        this.setSeo();
        this.closeSidebar();
      });
  }

  ngAfterViewInit(): void {
    const track = this.servicesTrackRef()?.nativeElement;
    if (track) {
      this.updateScrollState(track);
    }
  }

  // ── Carousel helpers ─────────────────────────────────────────────────────
  scrollServicesPrev(): void {
    const track = this.servicesTrackRef()?.nativeElement;
    if (!track) return;
    const delta = this.getIsRtl() ? this.CARD_SCROLL : -this.CARD_SCROLL;
    track.scrollBy({ left: delta, behavior: 'smooth' });
  }

  scrollServicesNext(): void {
    const track = this.servicesTrackRef()?.nativeElement;
    if (!track) return;
    const delta = this.getIsRtl() ? -this.CARD_SCROLL : this.CARD_SCROLL;
    track.scrollBy({ left: delta, behavior: 'smooth' });
  }

  onServicesScroll(track: HTMLElement): void {
    this.updateScrollState(track);
  }

  private updateScrollState(track: HTMLElement): void {
    const firstCard = track.firstElementChild as HTMLElement | null;
    const lastCard = track.lastElementChild as HTMLElement | null;

    if (!firstCard || !lastCard) {
      this.atStart = true;
      this.atEnd = true;
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const firstRect = firstCard.getBoundingClientRect();
    const lastRect = lastCard.getBoundingClientRect();
    const edgeTolerance = 1;

    if (this.getIsRtl()) {
      this.atStart = firstRect.right <= trackRect.right + edgeTolerance;
      this.atEnd = lastRect.left >= trackRect.left - edgeTolerance;
      return;
    }

    this.atStart = firstRect.left >= trackRect.left - edgeTolerance;
    this.atEnd = lastRect.right <= trackRect.right + edgeTolerance;
  }

  private getIsRtl(): boolean {
    if (!this.isBrowser) return false;
    return document.documentElement.getAttribute('dir') === 'rtl';
  }

  toggleLanguage(): void {
    const lang = this.currentLang === 'en' ? 'ar' : 'en';
    this.languageService.changeLanguage(lang);
    this.currentLang = lang;
  }

  onViewMoreServices(): void {
    void this.router.navigate(['/', this.currentLang, 'services']);
  }

  onViewMoreAboutUs(): void {
    void this.router.navigate(['/', this.currentLang, 'about-us']);
  }

  onViewMoreComplaints(): void {
    void this.router.navigate(['/', this.currentLang, 'complaints']);
  }

  onServiceApply(serviceId: string): void {
    void this.router.navigate(['/', this.currentLang, 'service-details'], {
      queryParams: { service: serviceId },
    });
  }

  onSendInquiry(): void {
    void this.router.navigate(['/', this.currentLang, 'inquiry']);
  }

  onSubmitComplaint(complaintType: string): void {
    void this.router.navigate(['/', this.currentLang, 'complaint-request'], {
      queryParams: { type: complaintType },
    });
  }



  private setSeo() {
    this.seo.update({
      title: this.translate.instant('home.seo.title'),
      description: this.translate.instant('home.seo.description'),
      keywords: this.translate.instant('home.seo.keywords'),
      url: this.translate.instant(environment.AppConfig.apiBaseUrl + 'home.seo.url'),
      author: this.translate.instant('home.seo.author'),
      type: 'website',
    });
  }
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}
