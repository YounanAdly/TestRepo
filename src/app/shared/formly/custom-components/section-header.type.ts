import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'formly-field-section-header',
  standalone: true,
  imports: [CommonModule, FormlyModule, TranslateModule],
  template: `
    <h3 [class]="headerClass">{{ props['labelKey'] || '' | translate }}</h3>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderTypeComponent extends FieldType<FieldTypeConfig> {
  get headerClass(): string {
    return (this.props['headerClass'] as string) ?? 'create-account-section-header';
  }
}
