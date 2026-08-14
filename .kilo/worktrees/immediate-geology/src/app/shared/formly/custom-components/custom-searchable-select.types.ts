import { Component, inject } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../../services/loader.service';
@Component({
    selector: 'formly-field-searchable-select.',
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
      (scrollToEnd)="onScrollToEnd()"
    >
      <ng-template ng-header-tmp>
        <small>Loaded {{ items.length }} / {{ total }}</small>
      </ng-template>
    </ng-select>

  `,
})
export class customSearchableSelectComponent extends FieldType<FieldTypeConfig> {
    items: any[] = [];
    page = 1;
    limit = 20;
    total = 0;
    loading = false;
    private loader = inject(LoaderService);

    constructor(private http: HttpClient) {
        super();
    }

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
