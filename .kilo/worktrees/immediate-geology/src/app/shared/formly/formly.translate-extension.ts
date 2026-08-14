import { Injectable } from '@angular/core';
import { FieldType, FormlyExtension, FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslateExtension implements FormlyExtension {
  constructor(private translate: TranslateService) { }

  prePopulate(field: FormlyFieldConfig): void {
        const to: any = field.props || {};
        if (!to.translate || to._translated) {
            return;
        }

        to._translated = true;
        field.expressions = {
            ...(field.expressions || {}),
            'templateOptions.label': this.translate.stream(to.label, { param: to.param }),
            'expressionProperties.label': this.translate.stream(to.label, { param: to.param }),
            'templateOptions.placeholder': to.placeholder ? this.translate.stream(to.placeholder) : ''
        };
  }
}
