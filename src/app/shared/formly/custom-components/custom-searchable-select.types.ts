
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
@Component({
    selector: 'formly-field-searchable-select',
    imports: [
    NgSelectModule,
    ɵInternalFormsSharedModule,
    FormsModule,
    ReactiveFormsModule
],
    template: `
   <ng-select
      [items]="items"
      [virtualScroll]="props['virtualScroll'] ?? true"
      [loading]="loading"
      [bindLabel]="props['bindLabel'] || 'title'"
      [bindValue]="props['bindValue'] || 'id'"
      [formControl]="formControl"
      [placeholder]="props['placeholder'] || 'Select an option'"
      appendTo="body"
      class="custom-searchable-select"
      (scrollToEnd)="onScrollToEnd()"
    >
    </ng-select>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }

        :host ::ng-deep .custom-searchable-select .ng-select-container {
            min-height: 56px;
            border: 1px solid var(--color-input-border) !important;
            border-radius: 8px !important;
            background-color: var(--color-modal-bg) !important;
            padding: 0 10px !important;
        }

        :host ::ng-deep .custom-searchable-select .ng-value-container .ng-placeholder {
            color: var(--color-placeholder-dimmed);
            font-family: 'AvantGarde Bk BT', sans-serif;
            font-size: 14px;
        }

        :host ::ng-deep .custom-searchable-select .ng-arrow-wrapper .ng-arrow {
            border-color: var(--color-orange) transparent transparent;
        }

        :host ::ng-deep .custom-searchable-select.ng-select-opened .ng-arrow-wrapper .ng-arrow {
            border-color: transparent transparent var(--color-orange);
        }

        :host ::ng-deep .custom-searchable-select.ng-select-focused .ng-select-container {
            border-color: var(--color-orange) !important;
            box-shadow: 0 0 0 3px var(--color-orange-focus-ring) !important;
        }

    `],
})
export class customSearchableSelectComponent extends FieldType<FieldTypeConfig> {
    items: any[] = [];
    page = 1;
    limit = 20;
    total = 0;
    loading = false;

    ngOnInit() {
        this.limit = this.props['limit'] || 20;
        this.loadData();
    }

    loadData() {
      
}

    onScrollToEnd() {
        this.page++;
        this.loadData();
    }
}
