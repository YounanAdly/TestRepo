
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { MultiSelectModule } from 'primeng/multiselect';
@Component({
  selector: 'formly-field-custom-multiselect',
  imports: [ReactiveFormsModule, FormlyModule, MultiSelectModule],
  template: `
    <p-multiselect
      [options]="items"
      [formControl]="formControl"
      [formlyAttributes]="field"
      [optionLabel]="optionLabel"
      [optionValue]="optionValue"
      [showClear]="true"
      [placeholder]="props.placeholder || ''"
      [styleClass]="'custom-multiselect'"
      panelStyleClass="custom-dropdown-panel"
      [appendTo]="'body'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    :host ::ng-deep .custom-multiselect {
      width: 100%;
      min-height: 56px;
      border: 1px solid var(--color-input-border);
      border-radius: 8px;
      background: var(--color-modal-bg);
      display: flex;
      align-items: center;
    }

    :host ::ng-deep .custom-multiselect .p-multiselect-label {
      padding: 16px 18px;
      color: var(--color-body-text);
      font-family: 'AvantGarde Bk BT', sans-serif;
      font-size: 14px;
    }

    :host ::ng-deep .custom-multiselect .p-multiselect-trigger {
      color: var(--color-orange);
      background: transparent;
      border: none;
      padding: 0 16px;
    }


    :host ::ng-deep .custom-multiselect.p-focus,
    :host ::ng-deep .custom-multiselect.p-inputwrapper-focus,
    :host ::ng-deep .custom-multiselect.p-multiselect-open,
    :host ::ng-deep .custom-multiselect.p-focus .p-multiselect-label-container,
    :host ::ng-deep .custom-multiselect.p-multiselect-open .p-multiselect-label-container {
      border-color: var(--color-orange) !important;
      box-shadow: 0 0 0 3px var(--color-orange-focus-ring) !important;
    }
  `],
})
export class CustomMultiSelectTypeComponent extends FieldType<FieldTypeConfig> {
  get items() {
    return this.props?.options as any[];
  }

  get optionLabel(): string {
    return (this.props?.['optionLabel'] as string) || 'label';
  }

  get optionValue(): string {
    return (this.props?.['optionValue'] as string) || 'value';
  }
}
