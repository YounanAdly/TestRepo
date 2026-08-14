import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'formly-field-custom-input',
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, InputMaskModule],
  template: `
    <input type="text" pInputText [formControl]="formControl"
      [formlyAttributes]="field"
      class="custom-input"
      [required]="props.required ? true : false"
      [placeholder]="props.placeholder"
      type="text"/>
  `,
})
export class CustomInputTypeComponent extends FieldType<FieldTypeConfig> {
}
