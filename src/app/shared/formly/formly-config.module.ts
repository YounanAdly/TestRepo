import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { FormlyModule } from '@ngx-formly/core';
import { InputTextModule } from 'primeng/inputtext';
import { CustomInputTypeComponent } from './custom-components/custom-input.type';
import { CustomDropDownTypeComponent } from './custom-components/drop-down/custom-dropdown.types';
import { CustomCalendarTypeComponent } from './custom-components/custom-calendar.types';
import { CustomMultiSelectTypeComponent } from './custom-components/custom-multiselect.types';
import { FormlyFileUploadType } from './custom-components/custom-file.types';
import { customSearchableSelectComponent } from './custom-components/custom-searchable-select.types';
import { CustomTextAreaTypeComponent } from './custom-components/custom-textarea.types';
import { AccountTypeToggleTypeComponent } from './custom-components/account-type-toggle.type';
import { SectionHeaderTypeComponent } from './custom-components/section-header.type';
import {
    emailPatternValidator,
    fullNamePatternValidator,
    mobileNumberLengthValidator,
    numberOnlyValidator,
    passwordMatchValidator,
    passwordStrengthValidator
} from './formly.validators';
@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        FormlyBootstrapModule,
        InputTextModule,
        FormlyModule.forRoot({
            extras: { lazyRender: true, resetFieldOnHide: true },
            validators: [
                {
                    name: 'emailPattern',
                    validation: emailPatternValidator
                },
                {
                    name: 'numbersOnly',
                    validation: numberOnlyValidator
                },
                {
                    name: 'fullNamePattern',
                    validation: fullNamePatternValidator
                },
                {
                    name: 'mobileNumberLength',
                    validation: mobileNumberLengthValidator
                }
            ],
            types: [
                {
                    name: 'custom-input',
                    component: CustomInputTypeComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'custom-dropdown',
                    component: CustomDropDownTypeComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'custom-calendar',
                    component: CustomCalendarTypeComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'custom-multiselect',
                    component: CustomMultiSelectTypeComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'searchable-select',
                    component: customSearchableSelectComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'file',
                    component: FormlyFileUploadType,
                    wrappers: ['form-field'],
                },
                {
                    name: 'custom-textarea',
                    component: CustomTextAreaTypeComponent,
                    wrappers: ['form-field'],
                },
                {
                    name: 'account-type-toggle',
                    component: AccountTypeToggleTypeComponent,
                },
                {
                    name: 'section-header',
                    component: SectionHeaderTypeComponent,
                }
            ]
        }),
    ],
    exports: [FormlyModule, FormsModule, ReactiveFormsModule]
})
export class FormlyConfigModule { }
