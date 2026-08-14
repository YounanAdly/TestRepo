import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'formly-field-custom-input',
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, InputTextModule],
  template: `
    <label
      [ngClass]="[containerClass, isDimmed ? 'is-dimmed' : '']"
      [attr.aria-label]="props['label'] || props['placeholder'] || 'input'"
    >
      <span class="custom-input-left-content">
        @if (iconSrc) {
          <img [class]="iconClass" [src]="iconSrc" alt="" />
        }
        <input
          pInputText
          [formControl]="formControl"
          [formlyAttributes]="field"
          [class]="inputClass"
          [required]="props.required ? true : false"
          [placeholder]="props.placeholder"
          [attr.type]="inputType"
          [attr.inputmode]="inputMode"
          [attr.autocomplete]="autoComplete"
          [attr.dir]="inputDir"
          [readonly]="isDimmed"
          [disabled]="isDisabled"
        />
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .custom-input-wrapper {
      display: block;
      width: 100%;
    }

    .custom-input-left-content {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      width: 100%;
      flex: 1 0 0;
    }

    .custom-input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      min-width: 0;
    }

    .form-input-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 56px;
      padding: 8px 16px;
      box-sizing: border-box;
      background: var(--color-modal-bg);
      border: 1px solid var(--color-input-border);
      border-radius: 8px;
      cursor: text;
      justify-content: flex-end;
      transition: all 0.2s ease;
    }


    .form-input-container:focus-within {
      border-color: var(--color-orange) !important;
      box-shadow: 0 0 0 3px var(--color-orange-focus-ring) !important;
    }

    .form-field-input {
      border: none;
      outline: none;
      background: transparent;
      flex: 1;
      min-width: 0;
      font-family: 'AvantGarde Bk BT', 'Century Gothic', 'Trebuchet MS', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 21px;
      color: var(--color-form-text);
      direction: inherit;
      text-align: start;
      box-shadow: none;
    }

    .form-field-input::placeholder {
      color: var(--color-form-text);
    }

    .form-input-container.is-dimmed {
      background: var(--color-surface-muted);
      border-color: var(--color-form-border-dimmed);
      cursor: default;
    }

    .form-input-container.is-dimmed .form-field-input,
    .form-input-container.is-dimmed .form-field-input::placeholder {
      color: var(--color-placeholder-dimmed);
    }

    .input-label {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 45px;
      padding: 6px 20px;
      box-sizing: border-box;
      background: var(--color-modal-bg);
      border: 1px solid var(--color-input-border);
      border-radius: 16px;
      cursor: text;
      justify-content: flex-end;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .input-label:focus-within {
      border-color: var(--color-input-border);
      box-shadow: none;
    }

    .field-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .field-input {
      border: none;
      outline: none;
      background: transparent;
      flex: 1;
      min-width: 0;
      font-family: 'AvantGarde Bk BT', 'Century Gothic', 'Trebuchet MS', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 21px;
      color: var(--color-body-text);
      direction: inherit;
      text-align: start;
      box-shadow: none;
    }

    .field-input.p-inputtext,
    .field-input.p-inputtext:focus,
    .form-field-input.p-inputtext,
    .form-field-input.p-inputtext:focus {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .field-input::placeholder {
      color: var(--color-placeholder-muted);
    }
  `],
})
export class CustomInputTypeComponent extends FieldType<FieldTypeConfig> {
  get variant(): string {
    return (this.props?.['variant'] as string) || 'form';
  }

  get inputType(): string {
    return (this.props?.['type'] as string) || 'text';
  }

  get inputMode(): string | null {
    return (this.props?.['inputmode'] as string) || null;
  }

  get autoComplete(): string | null {
    return (this.props?.['autocomplete'] as string) || null;
  }

  get inputDir(): string {
    return (this.props?.['dir'] as string) || 'auto';
  }

  get iconSrc(): string | null {
    return (this.props?.['prefixIconSrc'] as string) || null;
  }

  get isDimmed(): boolean {
    return !!this.props?.['dimmed'];
  }

  get isDisabled(): boolean {
    return !!this.props?.['disabled'];
  }

  get containerClass(): string {
    if (this.props?.['containerClass']) {
      return this.props['containerClass'] as string;
    }
    return this.variant === 'login' ? 'input-label' : 'form-input-container';
  }

  get inputClass(): string {
    if (this.props?.['inputClass']) {
      return this.props['inputClass'] as string;
    }
    return this.variant === 'login' ? 'field-input' : 'form-field-input';
  }

  get iconClass(): string {
    return (this.props?.['iconClass'] as string) || 'custom-input-icon';
  }
}
