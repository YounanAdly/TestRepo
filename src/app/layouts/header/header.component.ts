
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { LanguageService } from '../../shared/services/language.service';
import { AuthService } from '../../shared/services/auth.service';
import { ProfileAccount as DropdownProfileAccount, ProfileDropdownComponent } from '../../shared/components/profile-dropdown/profile-dropdown.component';
import { ProfileApi } from '../../shared/services/profile/profile-api.service';
import { ProfileAccount as ApiProfileAccount } from '../../shared/services/profile/profile.types';
import { ToastService } from '../../shared/services/toast.service';
import {
  AddAccountFormValue,
  AddAccountModalComponent,
  mapAddAccountFormToPayload,
} from '../../shared/components/add-account-modal/add-account-modal.component';
interface HeaderNavLink {
  labelKey: string;
  route: string;
  iconOnly?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, TranslateModule, ProfileDropdownComponent, AddAccountModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logoSrc = input('assets/images/logoCard.svg');
  readonly navLinks = input<HeaderNavLink[]>([
    { labelKey: '', route: 'home', iconOnly: true },
    { labelKey: 'header.nav.aboutUs', route: 'about-us' },
    { labelKey: 'header.nav.services', route: 'services' },
    { labelKey: 'header.nav.complaints', route: 'complaints' },
    { labelKey: 'header.nav.inquiry', route: 'inquiry' },
    { labelKey: 'header.nav.mediaCenter', route: 'media-center' },
    { labelKey: 'header.nav.faq', route: 'faq' },
]);

  private readonly authenticatedNavLinks: HeaderNavLink[] = [
    { labelKey: '', route: 'home', iconOnly: true },
    { labelKey: 'header.nav.aboutUs', route: 'about-us' },
    { labelKey: 'header.nav.services', route: 'services' },
    { labelKey: 'header.nav.complaints', route: 'complaints' },
    { labelKey: 'header.nav.inquiry', route: 'inquiry' },
    { labelKey: 'header.nav.mediaCenter', route: 'media-center' },
    { labelKey: 'header.nav.faq', route: 'faq' },
    { labelKey: 'header.nav.dashboard', route: 'dashboard' },
  ];

  getLocalizedRoute(route: string): string[] {
    return ['/', this.languageService.getCurrentLanguage() || 'en', route];
  }

  get resolvedNavLinks(): HeaderNavLink[] {
    return this.isAuthenticated ? this.authenticatedNavLinks : this.navLinks();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isNotificationsActive(): boolean {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    return cleanUrl.split('/').filter(Boolean)[1] === 'notifications';
  }

  isLinkActive(route: string): boolean {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const currentRoute = segments[1] || '';

    if (route === 'services') {
      return ['services', 'service-details', 'service-request'].includes(currentRoute);
    }

    if (route === 'complaints') {
      return ['complaints', 'complaint-request'].includes(currentRoute);
    }

    return currentRoute === route;
  }

  toggleLanguage(): void {
    const nextLanguage = this.languageService.getCurrentLanguage() === 'en' ? 'ar' : 'en';
    this.languageService.changeLanguage(nextLanguage);
  }

  goToNotifications(): void {
    void this.router.navigate(this.getLocalizedRoute('notifications'));
  }

  get languageLabel(): string {
    return this.languageService.getCurrentLanguage() === 'en' ? 'AR' : 'EN';
  }

  get userInitials(): string {
    return 'U';
  }

  private readonly profileAccountsResource = this.profileApi.accounts(() => this.authService.isAuthenticated());

  protected readonly profileAccounts = computed<DropdownProfileAccount[]>(() => {
    const rows = this.profileAccountsResource.value()?.result ?? [];
    return rows.map((row) => this.toDropdownAccount(row));
  });

  protected readonly activeAccount = computed(() => this.authService.selectedAccountId$());
  readonly isAddAccountOpen = signal(false);
  readonly isAddAccountSubmitting = signal(false);
  isSidebarOpen = false;

  onAccountSelected(account: DropdownProfileAccount): void {
    this.authService.setSelectedAccountId(account.id);
    void this.router.navigateByUrl(this.router.url);
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

  openSidebar(): void {
    this.isSidebarOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    document.body.style.overflow = '';
  }

  goToProfile(): void {
    void this.router.navigate(this.getLocalizedRoute('my-profile'));
  }

  logout(): void {
    this.authService.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.closeSidebar();
    void this.router.navigate(this.getLocalizedRoute('login'));
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
