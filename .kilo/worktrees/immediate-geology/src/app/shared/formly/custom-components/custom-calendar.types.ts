import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import { DatePicker } from 'primeng/datepicker';
import { PrimeNG } from 'primeng/config';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'formly-field-custom-input',
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, DatePickerModule],
  template: `
    <p-datepicker [formControl]="formControl"
      [showIcon]="true"
      [formlyAttributes]="field" />
  `,
})
export class CustomCalendarTypeComponent extends FieldType<FieldTypeConfig> {
  private translateService = inject(TranslateService);
  private primeNGConfig = inject(PrimeNG);
  @ViewChild('calendar', { static: false }) calendar!: DatePicker;

  ngOnInit(): void {
    this.setCalendarLang();
    this.translateService.onLangChange.subscribe(res => {
      if (res) {
        this.setCalendarLang();
      }
    });
  }

  setCalendarLang() {
    this.primeNGConfig.setTranslation(
      {
        dayNames: this.translateService.instant('primeng.dayNames'),
        dayNamesShort: this.translateService.instant('primeng.dayNamesShort'),
        dayNamesMin: this.translateService.instant('primeng.dayNamesMin'),
        monthNames: this.translateService.instant('primeng.monthNames'),
        monthNamesShort: this.translateService.instant('primeng.monthNamesShort'),
        today: this.translateService.instant('primeng.today'),
        clear: this.translateService.instant('primeng.clear')
      }
    );
    this.calendar?.ngOnInit();
  }
}
