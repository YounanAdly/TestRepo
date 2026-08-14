import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { MultiSelectModule } from 'primeng/multiselect';
@Component({
    selector: 'formly-field-custom-input',
    imports: [CommonModule, ReactiveFormsModule, FormlyModule, MultiSelectModule],
    template: `
   <p-multiselect [options]="cities" [formControl]="formControl"
   appendTo="body"
        optionLabel="name"
    optionValue="code"
    [showClear]="true"
      [formlyAttributes]="field" optionLabel="name" placeholder="Select a City" />

  `,
})
export class CustomMultiSelectTypeComponent extends FieldType<FieldTypeConfig> {
    cities = [{ name: 'New Y', code: 'NY' },{ name: 'New N', code: 'NN' }]
}
