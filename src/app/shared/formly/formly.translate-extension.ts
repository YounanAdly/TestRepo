import { Injectable } from '@angular/core';
import { FormlyExtension, FormlyFieldConfig } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslateExtension implements FormlyExtension {
  constructor(private readonly translate: TranslateService) {}


  prePopulate(field: FormlyFieldConfig): void {
    const to: any = field.props || {};
    if (!to.translate || to._translated) {
      return;
    }

    to._translated = true;
    field.expressions = {
      ...(field.expressions || {}),
      ...(to.label ? {
        'props.label': this.translate.stream(to.label, { param: to.param }),
        'templateOptions.label': this.translate.stream(to.label, { param: to.param }),
        'expressionProperties.label': this.translate.stream(to.label, { param: to.param }),
      } : {}),
      ...(to.placeholder ? {
        'props.placeholder': this.translate.stream(to.placeholder),
        'templateOptions.placeholder': this.translate.stream(to.placeholder),
      } : {}),
    };
  }
}
