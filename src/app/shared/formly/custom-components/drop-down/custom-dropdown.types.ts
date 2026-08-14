
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'formly-field-custom-dropdown',
    imports: [ReactiveFormsModule, FormlyModule, SelectModule],
    template: `
        <p-select
            [options]="items"
            [formControl]="formControl"
            [formlyAttributes]="field"
            appendTo="body"
            [optionLabel]="optionLabel"
            [optionValue]="optionValue"
            [showClear]="showClear"
            [placeholder]="placeholder"
            [disabled]="isDisabled"
            [styleClass]="dropdownClass"
            panelStyleClass="custom-dropdown-panel"
        />
  `,
        changeDetection: ChangeDetectionStrategy.Eager,
        styles: [`
            :host {
                display: block;
                width: 100%;
            }

            :host ::ng-deep .custom-dropdown {
                width: 100%;
                min-height: 56px;
                border: 1px solid var(--color-input-border);
                border-radius: 8px;
                background: var(--color-modal-bg);
            }

            :host ::ng-deep .custom-dropdown .p-select-label {
                color: var(--color-body-text);
                font-family: 'AvantGarde Bk BT', sans-serif;
                font-size: 14px;
                padding: 16px 18px;
                display: flex;
                align-items: center;
            }

            :host ::ng-deep .custom-dropdown .p-select-dropdown {
                color: var(--color-orange);
                background: transparent;
                border: none;
            }

            :host ::ng-deep .custom-dropdown .p-select-dropdown-icon {
                color: var(--color-orange);
                font-size: 14px;
            }


            :host ::ng-deep .custom-dropdown.p-focus,
            :host ::ng-deep .custom-dropdown.p-inputwrapper-focus,
            :host ::ng-deep .custom-dropdown.p-select-open,
            :host ::ng-deep .custom-dropdown.p-focus .p-select-label-container,
            :host ::ng-deep .custom-dropdown.p-select-open .p-select-label-container {
                border-color: var(--color-orange) !important;
                box-shadow: 0 0 0 3px var(--color-orange-focus-ring) !important;
            }

            :host ::ng-deep .custom-dropdown.dimmed {
                background: var(--color-surface-muted);
                border-color: var(--color-form-border-dimmed);
            }

            :host ::ng-deep .custom-dropdown.dimmed .p-select-label,
            :host ::ng-deep .custom-dropdown.dimmed .p-select-dropdown {
                color: var(--color-placeholder-dimmed);
            }
        `],
})
export class CustomDropDownTypeComponent extends FieldType<FieldTypeConfig> {

    get items() {
        return this.props?.options as any[];
    }

        get optionLabel(): string {
                return (this.props?.['optionLabel'] as string) || 'label';
        }

        get optionValue(): string {
                return (this.props?.['optionValue'] as string) || 'value';
        }

        get placeholder(): string {
                return (this.props?.['placeholder'] as string) || '';
        }

        get showClear(): boolean {
                return !!this.props?.['showClear'];
        }

        get isDisabled(): boolean {
                return !!this.props?.['disabled'];
        }

        get dropdownClass(): string {
                return this.props?.['dimmed'] ? 'custom-dropdown dimmed' : 'custom-dropdown';
        }
}
