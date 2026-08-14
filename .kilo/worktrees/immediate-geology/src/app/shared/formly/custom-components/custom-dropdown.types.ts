import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { SelectModule } from 'primeng/select';
'@angular/platform-browser'

@Component({
    selector: 'formly-field-custom-input',
    imports: [CommonModule, ReactiveFormsModule, FormlyModule, SelectModule],
    template: `
   <p-select [options]="items" [formControl]="formControl"
   appendTo="body"
        optionLabel="label"
    optionValue="value"
    [showClear]="true"
      [formlyAttributes]="field" placeholder="Select a City" />

  `,
})
export class CustomDropDownTypeComponent extends FieldType<FieldTypeConfig> {

    get items() {
        console.log('Options:', this.props);
        return this.props?.options as any[];
    }
}
