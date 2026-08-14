import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, input, output } from '@angular/core';

type ButtonVariant = 'login-primary' | 'login-outline' | 'action-primary' | 'action-outline' | 'otp-verify' | 'service-apply';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled()"
      [ngClass]="buttonClass"
      (click)="clicked.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .btn {
      border: none;
      cursor: pointer;
      /* Include transform + box-shadow in transition for tactile feedback */
      transition: background var(--transition-fast, 150ms ease),
                  color       var(--transition-fast, 150ms ease),
                  opacity     var(--transition-fast, 150ms ease),
                  transform   var(--transition-fast, 150ms ease),
                  box-shadow  var(--transition-fast, 150ms ease);
      font-family: 'AvantGarde Bk BT', 'Century Gothic', 'Trebuchet MS', sans-serif;
      font-weight: 700;
      font-size: 16px;
      line-height: 22px;
      text-align: center;
      padding: 12px;
    }

    /* Tactile press feedback — subtle scale down + shadow reduction */
    .btn:active:not(:disabled) {
      transform: scale(0.96);
      box-shadow: none !important;
    }

    /* Accessible keyboard focus ring */
    .btn:focus-visible {
      outline: 2px solid var(--color-teal);
      outline-offset: 3px;
      border-radius: inherit;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Respect user motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .btn { transition: background var(--transition-fast, 150ms ease),
                         color var(--transition-fast, 150ms ease),
                         opacity var(--transition-fast, 150ms ease); }
      .btn:active:not(:disabled) { transform: none; }
    }

    .full-width {
      width: 100%;
    }

    .login-primary {
      background: var(--color-orange);
      color: var(--color-modal-bg);
      border-radius: 16px;
    }

    .login-primary:hover {
      background: var(--color-orange-hover);
    }

    .login-outline {
      background: var(--color-modal-bg);
      border: 1px solid var(--color-input-border);
      color: var(--color-orange);
      border-radius: 16px;
    }

    .login-outline:hover {
      background: var(--color-surface-muted);
    }

    .action-primary,
    .action-outline {
      width: 154px;
      height: 45px;
      border-radius: 20px;
      box-shadow: 0 0 15.2px 6px var(--color-orange-soft-shadow);
      font-family: 'Poppins', 'AvantGarde Bk BT', sans-serif;
      font-weight: 500;
      line-height: 30px;
      padding: 0 12px;
    }

    .action-primary {
      background: var(--color-orange);
      color: var(--color-modal-bg);
    }

    .action-primary:hover:not(:disabled) {
      background: var(--color-orange-hover);
    }

    .action-outline {
      background: var(--color-modal-bg);
      border: 1px solid var(--color-orange);
      color: var(--color-orange);
    }

    .action-outline:hover:not(:disabled) {
      background: var(--color-surface-soft);
    }

    .otp-verify {
      min-height: 40px;
      border-radius: 16px;
      background: var(--color-orange);
      color: var(--color-modal-bg);
      padding: 9px 16px;
      line-height: 22px;
    }

    .otp-verify:hover {
      background: var(--color-orange-hover);
    }

    .service-apply {
      width: 100%;
      min-height: 35px;
      border-radius: 20px;
      background: var(--color-orange);
      color: var(--color-modal-bg);
      font-family: 'Poppins', 'AvantGarde Bk BT', sans-serif;
      font-weight: 500;
      font-size: 16px;
      line-height: 30px;
      padding: 0 12px;
    }

    .service-apply:hover {
      background: var(--color-orange-hover);
    }
  `],
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('login-primary');
  readonly fullWidth = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);

  readonly clicked = output<Event>();

  @HostBinding('style.display')
  get hostDisplay(): string {
    return this.fullWidth() ? 'block' : 'inline-flex';
  }

  @HostBinding('style.width')
  get hostWidth(): string {
    return this.fullWidth() ? '100%' : 'auto';
  }

  get buttonClass(): string[] {
    return ['btn', this.variant(), this.fullWidth() ? 'full-width' : ''];
  }
}
