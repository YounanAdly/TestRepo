import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface ProfileAccount {
  id: string;
  name: string;
  typeLabelKey: string;
  avatarSrc?: string;
  avatarInitials?: string;
}

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrl: './profile-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDropdownComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly accounts = input<ProfileAccount[]>([]);
  readonly activeAccountId = input<string | null>(null);
  readonly avatarSrc = input<string>('assets/images/user-placeholder.svg');
  readonly triggerAriaLabelKey = input<string>('header.actions.profile');

  readonly accountSelected = output<ProfileAccount>();
  readonly addAccount = output<void>();
  readonly profileSelected = output<void>();
  readonly loggedOut = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly resolvedActiveId = computed(() => {
    const explicit = this.activeAccountId();
    if (explicit) {
      return explicit;
    }
    return this.accounts()[0]?.id ?? null;
  });

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((open) => !open);
  }

  selectAccount(account: ProfileAccount, event: Event): void {
    event.stopPropagation();
    this.accountSelected.emit(account);
  }

  onAddAccount(): void {
    this.isOpen.set(false);
    this.addAccount.emit();
  }

  onProfile(): void {
    this.isOpen.set(false);
    this.profileSelected.emit();
  }

  onLogout(): void {
    this.isOpen.set(false);
    this.loggedOut.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
