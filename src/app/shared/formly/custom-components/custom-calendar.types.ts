
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'formly-field-custom-calendar',
  imports: [ReactiveFormsModule, FormlyModule, DatePickerModule],
  template: `
    <p-datepicker
      [formControl]="formControl"
      [showIcon]="true"
      [formlyAttributes]="field"
      [placeholder]="props.placeholder || ''"
      [styleClass]="'custom-calendar'"
      [appendTo]="'body'"
      [iconDisplay]="'input'"
      [view]="calendarView"
      [dateFormat]="calendarDateFormat"
      [readonlyInput]="isReadonlyInput"
    />
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    :host ::ng-deep .custom-calendar {
      width: 100%;
      min-height: 56px;
      border: 1px solid var(--color-input-border);
      border-radius: 8px;
      background: var(--color-modal-bg);
      display: flex;
      align-items: center;
    }

    :host ::ng-deep .custom-calendar .p-datepicker-input {
      border: none;
      background: transparent;
      box-shadow: none;
      padding: 16px 18px;
      color: var(--color-body-text);
      font-family: 'AvantGarde Bk BT', sans-serif;
      font-size: 14px;
      width: 100%;
      cursor: pointer;
    }

    :host ::ng-deep .custom-calendar .p-datepicker-input::placeholder {
      color: var(--color-placeholder-dimmed);
    }

    :host ::ng-deep .custom-calendar .p-datepicker-trigger {
      color: var(--color-orange);
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0 16px;
      border-radius: 0 8px 8px 0;
      transition: background 0.15s ease;
    }

    :host ::ng-deep .custom-calendar .p-datepicker-trigger:hover {
      background: var(--color-filter-dropdown-bg);
    }


    :host ::ng-deep .custom-calendar.p-focus,
    :host ::ng-deep .custom-calendar.p-inputwrapper-focus,
    :host ::ng-deep .custom-calendar.p-focus .p-inputtext,
    :host ::ng-deep .custom-calendar.p-inputwrapper-focus .p-inputtext {
      border-color: var(--color-orange) !important;
      box-shadow: 0 0 0 3px var(--color-orange-focus-ring) !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCalendarTypeComponent extends FieldType<FieldTypeConfig> {
  private translateService = inject(TranslateService);
  private primeNGConfig = inject(PrimeNG);
  private readonly destroyRef = inject(DestroyRef);

  get calendarView(): 'date' | 'month' | 'year' {
    return (this.props?.['view'] as 'date' | 'month' | 'year') || 'date';
  }

  get calendarDateFormat(): string {
    return (this.props?.['dateFormat'] as string) || 'dd/mm/yy';
  }

  get isReadonlyInput(): boolean {
    return !!this.props?.['readonlyInput'];
  }

  ngOnInit(): void {
    this.setCalendarLang();
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
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
  }
}
