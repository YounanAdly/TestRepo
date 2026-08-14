import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button.component';
import { AuthPromptService } from '../../services/auth-prompt.service';

@Component({
  selector: 'app-login-prompt-dialog',
  standalone: true,
  imports: [A11yModule, TranslateModule, ButtonComponent],
  templateUrl: './login-prompt-dialog.component.html',
  styleUrl: './login-prompt-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPromptDialogComponent {
  readonly authPrompt = inject(AuthPromptService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.authPrompt.isOpen()) {
      this.authPrompt.cancel();
    }
  }

  onLogin(): void {
    this.authPrompt.confirm();
  }

  onCancel(): void {
    this.authPrompt.cancel();
  }
}
