import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';

interface SegmentedOption {
  value: string;
  labelKey: string;
  iconSrc?: string;
}

@Component({
  selector: 'formly-field-account-type-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, TranslateModule],
  template: `
    <div
      class="account-type-toggle"
      role="radiogroup"
      [attr.aria-label]="(props['ariaLabel'] || props['label'] || '') | translate"
    >
      @for (option of segmentedOptions; track option.value; let last = $last) {
        @let isSelected = formControl.value === option.value;
        <button
          type="button"
          class="account-type-toggle__option"
          [class.account-type-toggle__option--active]="isSelected"
          role="radio"
          [attr.aria-checked]="isSelected"
          (click)="select(option.value)"
        >
          <span
            class="account-type-toggle__radio"
            [class.account-type-toggle__radio--checked]="isSelected"
            aria-hidden="true"
          >
            <span class="account-type-toggle__radio-dot"></span>
          </span>
          @if (option.iconSrc) {
            <span class="account-type-toggle__icon" aria-hidden="true">
              <img [src]="option.iconSrc" alt="" width="18" height="18" />
            </span>
          }
          <span class="account-type-toggle__label">{{ option.labelKey | translate }}</span>
        </button>
        @if (!last) {
          <span class="account-type-toggle__divider" aria-hidden="true"></span>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .account-type-toggle {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      padding: 4px 0;
    }

    .account-type-toggle__option {
      -webkit-appearance: none;
      appearance: none;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 6px 4px;
      background: transparent;
      border: 0;
      cursor: pointer;
      color: var(--color-body-text);
      font-family: 'AvantGarde Bt BT', 'Century Gothic', 'Trebuchet MS', sans-serif;
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }

    .account-type-toggle__option:hover .account-type-toggle__radio {
      border-color: var(--color-orange);
    }

    .account-type-toggle__option:focus-visible {
      outline: 2px solid var(--color-orange);
      outline-offset: 3px;
    }

    .account-type-toggle__radio {
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--color-orange);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background var(--transition-fast);
    }

    .account-type-toggle__radio-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: transparent;
      transition: background var(--transition-fast);
    }

    .account-type-toggle__radio--checked .account-type-toggle__radio-dot {
      background: var(--color-orange);
    }

    .account-type-toggle__icon {
      width: 35px;
      height: 34px;
      border-radius: 50%;
      background: var(--color-account-personal-bg);
      border: 1px solid var(--color-teal-dark);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .account-type-toggle__icon img {
      width: 18px;
      height: 18px;
      display: block;
    }

    .account-type-toggle__label {
      color: var(--color-dark-blue);
      white-space: nowrap;
    }

    .account-type-toggle__divider {
      width: 1px;
      height: 37px;
      background: var(--color-account-divider);
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .account-type-toggle__option,
      .account-type-toggle__radio,
      .account-type-toggle__radio-dot {
        transition: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountTypeToggleTypeComponent extends FieldType<FieldTypeConfig> {
  get segmentedOptions(): SegmentedOption[] {
    return (this.props['options'] as SegmentedOption[]) ?? [];
  }

  select(value: string): void {
    this.formControl.setValue(value);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }
}
