
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'formly-field-custom-textarea',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, TranslateModule],
  template: `
    <div class="custom-textarea-wrap">
      <textarea
        class="custom-textarea-input"
        [class.is-compact]="isCompact"
        [id]="textareaId"
        [formControl]="formControl"
        [formlyAttributes]="field"
        [attr.placeholder]="props['placeholder'] | translate"
        [attr.maxLength]="maxLength || null"
        [attr.rows]="rows"
        [readonly]="isReadonly"
      [disabled]="isReadonly"></textarea>
    
      <div class="custom-textarea-meta">
        <span class="custom-textarea-helper">{{ helperText }}</span>
        @if (maxLength) {
          <span class="custom-textarea-counter">{{ currentLength }} / {{ maxLength }}</span>
        }
      </div>
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .custom-textarea-wrap {
        width: 100%;
      }

      .custom-textarea-input {
        width: 100%;
        min-height: 148px;
        border: 1px solid var(--color-form-border);
        border-radius: 12px;
        background: var(--color-modal-bg);
        padding: 14px 18px;
        resize: none;
        outline: none;
        color: var(--color-body-text);
        font-family: 'AvantGarde Bk BT', sans-serif;
        font-size: 14px;
        line-height: 21px;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }

      .custom-textarea-input.is-compact {
        min-height: 64px;
        padding: 10px 16px;
      }

      .custom-textarea-input:focus {
        border-color: var(--color-orange);
      }

      .custom-textarea-input::placeholder {
        color: var(--color-placeholder-dimmed);
      }

      .custom-textarea-meta {
        margin-top: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: var(--color-placeholder-dimmed);
        font-family: 'AvantGarde Bk BT', sans-serif;
        font-size: 14px;
        line-height: 21px;
      }

      .custom-textarea-helper {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .custom-textarea-helper::before {
        content: 'i';
        width: 18px;
        height: 18px;
        border: 1.5px solid var(--color-placeholder-dimmed);
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
      }

      .custom-textarea-counter {
        white-space: nowrap;
      }
    `,
  ],
})
export class CustomTextAreaTypeComponent extends FieldType<FieldTypeConfig> {
  private readonly translate = inject(TranslateService);

  get textareaId(): string {
    return this.id || this.field.key?.toString() || 'custom-textarea';
  }

  get maxLength(): number {
    const value = Number(this.props?.['maxLength'] || 0);
    return Number.isFinite(value) ? value : 0;
  }

  get currentLength(): number {
    return String(this.formControl?.value || '').length;
  }

  get helperText(): string {
    const key = (this.props?.['helperText'] as string) || '';
    return key ? this.translate.instant(key) : '';
  }

  get isReadonly(): boolean {
    return !!this.props?.['readonly'];
  }

  get isCompact(): boolean {
    return !!this.props?.['compact'];
  }

  get rows(): number | null {
    const value = Number(this.props?.['rows'] ?? 0);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
    return this.isCompact ? 2 : null;
  }
}
