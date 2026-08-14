// font-size.service.ts
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CommonService } from './common.service';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { DropdownOption } from '../formly/custom-components/drop-down/dropdown.model';

@Injectable({ providedIn: 'root' })
export class FormlyService {
    constructor() { }

    /**
     * Sets the options array for a Formly field by key.
     * @param fields Formly field configuration array
     * @param key Unique key of the target field
     * @param options Options to assign to the field
     */
    setDropdownValue(fields: FormlyFieldConfig[], key: string, options: DropdownOption<string>[] | any[] | undefined) {
        const field = this.getField(key, fields)
        if (field) {
            field.props!.options = options;
        }
    }

    /**
     * Recursively searches for a Formly field by key.
     * @param key Unique key of the field to find
     * @param fields Formly field configuration array
     * @returns The matching field or null if not found
     */
    getField(key: string, fields: FormlyFieldConfig[]): FormlyFieldConfig | null {
        for (let i = 0, len = fields.length; i < len; i++) {
            const f = fields[i];
            if (f.key === key) {
                return f;
            }

            if (f.fieldGroup && !f.key) {
                const cf = this.getField(key, f.fieldGroup);
                if (cf) {
                    return cf;
                }
            }
        }
        return null;
    }
}
