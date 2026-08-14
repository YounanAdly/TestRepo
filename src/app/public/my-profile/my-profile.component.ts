import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { AuthService } from '../../shared/services/auth.service';
import { ProfileApi } from '../../shared/services/profile/profile-api.service';
import { ProfileAccount, ProfileDetails } from '../../shared/services/profile/profile.types';
import { ToastService } from '../../shared/services/toast.service';
import {
  AddAccountFormValue,
  AddAccountModalComponent,
  mapAddAccountFormToPayload,
} from '../../shared/components/add-account-modal/add-account-modal.component';

type AccountVariant = 'personal' | 'company';
type BillAccountStatus = 'active' | 'pending' | 'inactive';
type QuickActionKind = 'history' | 'notifications' | 'dashboard';

interface UserProfile {
  fullName: string;
  accountTypeKey: string;
  accountNumber: string;
  initials: string;
}

interface UserAccount {
  id: string;
  name: string;
  variant: AccountVariant;
  accountTypeKey: string;
  accountNumber: string;
  initials: string;
}

interface OverviewRow {
  labelKey: string;
  value: string;
}

interface BillAccountRow {
  id: string;
  accountNumber: string;
  outstanding: string;
  status: BillAccountStatus;
}

interface QuickAction {
  kind: QuickActionKind;
  iconSrc: string;
  titleKey: string;
  subtitleKey: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [RouterLink, TranslateModule, AddAccountModalComponent],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileComponent {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  private readonly accountsResource = this.profileApi.accounts(() => this.authService.isAuthenticated());

  readonly accounts = computed<UserAccount[]>(() => {
    const rows = this.accountsResource.value()?.result ?? [];
    return rows.map((account, index) => this.toUserAccount(account, index));
  });

  readonly selectedAccountId = linkedSignal<{ accounts: UserAccount[]; authSelectedId: string | null }, string | null>({
    source: () => ({
      accounts: this.accounts(),
      authSelectedId: this.authService.selectedAccountId$(),
    }),
    computation: ({ accounts, authSelectedId }, prev) => {
      if (!accounts.length) {
        return authSelectedId;
      }
      // Always honour an externally-set account (e.g. header dropdown switch)
      // before falling back to the locally-held previous value.
      if (authSelectedId && accounts.some((account) => account.id === authSelectedId)) {
        return authSelectedId;
      }
      if (prev?.value && accounts.some((account) => account.id === prev.value)) {
        return prev.value;
      }
      return accounts[0].id;
    },
  });

  readonly selectedAccount = computed<UserAccount | null>(() => {
    const selectedId = this.selectedAccountId();
    return this.accounts().find((account) => account.id === selectedId) ?? null;
  });

  readonly profile = computed<UserProfile>(() => {
    const details = this.authService.profile();
    const account = this.selectedAccount();
    const fullName = fullNameFromProfile(details) || account?.name || '';

    return {
      fullName,
      accountTypeKey: account?.accountTypeKey ?? 'myProfile.accountType.personal',
      accountNumber: account?.accountNumber ?? this.selectedAccountId() ?? '',
      initials: computeInitials(fullName || account?.name || ''),
    };
  });

  readonly overviewRows = computed<OverviewRow[]>(() => {
    const details = this.authService.profile();
    const account = this.selectedAccount();
    const dash = '—';
    const isPersonal = details?.accountType === 1;
    const rows: OverviewRow[] = [
      {
        labelKey: 'myProfile.overview.rows.accountType',
        value: this.translate.instant(account?.accountTypeKey ?? 'myProfile.accountType.personal'),
      },
      { labelKey: 'myProfile.overview.rows.email', value: details?.email?.trim() || dash },
      { labelKey: 'myProfile.overview.rows.phone', value: details?.mobilePhone?.trim() || dash },
    ];
    if (isPersonal) {
      rows.push({ labelKey: 'myProfile.overview.rows.civilId', value: details?.civilId?.trim() || dash });
    } else {
      rows.push({ labelKey: 'myProfile.overview.rows.crNo', value: details?.crNo?.trim() || dash });
    }
    rows.push({ labelKey: 'myProfile.overview.rows.address', value: details?.address?.trim() || dash });
    return rows;
  });

  readonly selectedBillAccountId = signal<string | null>(null);
  /** Reflects whether AuthService.profileResource is loading for the active account. */
  readonly isProfileLoading = computed(() => this.authService.isProfileLoading());

  private readonly billAccountsResource = this.profileApi.billingAccounts(
    () => this.authService.isAuthenticated(),
  );

  readonly isBillAccountsLoading = computed(() => this.billAccountsResource.isLoading());

  readonly billAccounts = computed<BillAccountRow[]>(() => {
    const rows = this.billAccountsResource.value()?.result ?? [];
    return rows.map((row) => ({
      id: row.accountId,
      accountNumber: row.name,
      outstanding: row.totalOutstanding != null
        ? `${row.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OMR`
        : '0.00 OMR',
      status: this.toBillAccountStatus(row.statusCode),
    }));
  });

  readonly quickActions = signal<QuickAction[]>([
    {
      kind: 'history',
      iconSrc: 'assets/images/profile-quick-history.svg',
      titleKey: 'myProfile.quickAction.history.title',
      subtitleKey: 'myProfile.quickAction.history.subtitle',
    },
    {
      kind: 'notifications',
      iconSrc: 'assets/images/profile-quick-notifications.svg',
      titleKey: 'myProfile.quickAction.notifications.title',
      subtitleKey: 'myProfile.quickAction.notifications.subtitle',
    },
    {
      kind: 'dashboard',
      iconSrc: 'assets/images/profile-quick-dashboard.svg',
      titleKey: 'myProfile.quickAction.dashboard.title',
      subtitleKey: 'myProfile.quickAction.dashboard.subtitle',
    },
  ]);

  readonly currentLang = computed(() => this.languageService.getCurrentLanguage() || 'en');
  readonly localizedHomeRoute = computed(() => ['/', this.currentLang(), 'home']);

  readonly isAddAccountOpen = signal(false);
  readonly isAddAccountSubmitting = signal(false);

  private readonly selectedAccountEffect = effect(() => {
    const selectedId = this.selectedAccountId();
    if (!selectedId) {
      return;
    }
    // Persist choice so auth interceptor attaches X-Account-Id on every request.
    // AuthService.profileResource reacts to selectedAccountId changes and
    // re-fetches profile automatically — no explicit loadSelectedProfile() needed.
    this.authService.setSelectedAccountId(selectedId);
  });

  ngOnInit(): void {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.setSeo());
  }

  onEditProfile(): void {
    // TODO: route to edit-profile flow once it lands.
  }

  onAddAccount(): void {
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
          this.accountsResource.reload();
          this.isAddAccountOpen.set(false);
        },
        // Transport errors (5xx / 0 / 503 / timeout) are toasted by errorInterceptor.
        error: () => { /* no-op */ },
      });
  }

  onSelectAccount(id: string): void {
    this.selectedAccountId.set(id);
  }

  onSelectBillAccount(id: string): void {
    this.selectedBillAccountId.set(id);
    this.openAccountSummary(id);
  }

  onViewBillAccount(row: BillAccountRow): void {
    this.selectedBillAccountId.set(row.id);
    this.openAccountSummary(row.id);
  }

  /** Navigates to the language-prefixed account-summary page for the given bill account. */
  private openAccountSummary(accountId: string): void {
    void this.router.navigate(
      ['/', this.currentLang(), 'account-summary'],
      { queryParams: { account: accountId } },
    );
  }

  onQuickAction(action: QuickAction): void {
    const routeMap: Record<QuickActionKind, string | null> = {
      history: 'view-bills',
      notifications: 'notifications',
      dashboard: 'dashboard',
    };
    const route = routeMap[action.kind];
    if (route) {
      void this.router.navigate(['/', this.currentLang(), route]);
    }
  }

  private toUserAccount(account: ProfileAccount, index: number): UserAccount {
    // API only distinguishes personal ('1') vs organization ('2').
    const variant: AccountVariant = this.deriveVariant(account);
    return {
      id: account.accountId,
      name: account.name,
      variant,
      accountTypeKey: `myProfile.accountType.${variant}`,
      accountNumber: account.accountId,
      initials: computeInitials(account.name),
    };
  }

  private deriveVariant(account: ProfileAccount): AccountVariant {
    if (account.accountType === 1 || account.accountType === '1') {
      return 'personal';
    }
    return 'company';
  }

  private toBillAccountStatus(statusCode: number): BillAccountStatus {
    // statusCode 1 = Active; extend mapping as the API evolves.
    const map: Record<number, BillAccountStatus> = {
      1: 'active',
    };
    return map[statusCode] ?? 'inactive';
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('myProfile.seo.title'),
      description: this.translate.instant('myProfile.seo.description'),
      keywords: this.translate.instant('myProfile.seo.keywords'),
      url: this.translate.instant('myProfile.seo.url'),
      author: this.translate.instant('myProfile.seo.author'),
      type: 'website',
    });
  }
}

function fullNameFromProfile(details: ProfileDetails | null): string {
  if (!details) {
    return '';
  }
  return [details.firstName, details.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
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
