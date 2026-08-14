import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button.component';

@Component({
  selector: 'app-success-alert-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, A11yModule],
  templateUrl: './success-alert-modal.component.html',
  styleUrl: './success-alert-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessAlertModalComponent {
  readonly variant = input<'default' | 'service-request'>('default');
  readonly isOpen = input(false);
  readonly iconSrc = input('assets/images/copy-success.svg');
  readonly closeIconSrc = input('assets/images/close-icon.svg');
  readonly titleKey = input('createAccount.success.title');
  readonly titleParams = input<Record<string, string | number>>();
  readonly descriptionKey = input('createAccount.success.description');
  readonly doneLabelKey = input('createAccount.success.done');
  readonly closeLabelKey = input('createAccount.success.close');

  readonly done = output<void>();
  readonly closed = output<void>();

  onDone(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.done.emit();
  }

  onClose(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.closed.emit();
  }
}
