import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '../button.component';
import { DropdownOption } from '../../formly/custom-components/drop-down/dropdown.model';
import { FormlyService } from '../../services/formly.service';
import { LookupApi } from '../../services/lookup/lookup-api.service';
import { LookupEntityOption } from '../../services/lookup/lookup.types';
import { CreateProfileAccountPayload } from '../../services/profile/profile.types';
// Reuse the create-account Formly form definition — the modal collects the same
// applicant details, so we pick the base fields (before the org-only company
// section) directly from the co-located form.json.
import createAccountForm from '../../../public/create-account/form.json';

/** Index in form.json where company-specific fields start (section-header + 2 fieldGroups).
 *  Layout: 0=select-account-type header, 1=account-type-toggle, 2=applicant-details header,
 *  3–8=applicant field groups, 9=company-details header, 10+=company field groups. */
const COMPANY_FIELDS_START = 9;

export interface AddAccountFormValue {
  accountType: 'personal' | 'organization';
  firstName: string;
  lastName: string;
  civilId: string;
  emailAddress: string;
  wilaya: string;
  address: string;
  phone: string;
  /** Populated only when accountType === 'organization'. */
  companyName?: string;
  crNumber?: string;
  companyPhone?: string;
  companyAddress?: string;
}

/**
 * Maps the modal's form value to the backend `POST /profile/accounts` shape.
 *
 * Rules:
 * - `accountType` — `1` = personal, `2` = organization.
 * - `middleName` — always empty (backend requires the field to be present).
 * - `alWilayaId` — the GUID stored in the `wilaya` control from the lookup.
 * - `name` / `telephone1` / `crNo` — sent only for organization payloads.
 */
export function mapAddAccountFormToPayload(value: AddAccountFormValue): CreateProfileAccountPayload {
  const isOrganization = value.accountType === 'organization';
  const base: CreateProfileAccountPayload = {
    accountType: isOrganization ? 2 : 1,
    firstName: value.firstName?.trim() ?? '',
    middleName: '',
    lastName: value.lastName?.trim() ?? '',
    emailAddress1: value.emailAddress?.trim() ?? '',
    mobilePhone: value.phone?.trim() ?? '',
    civilId: value.civilId?.trim() ?? '',
    alWilayaId: value.wilaya ?? '',
  };
  if (!isOrganization) {
    return base;
  }
  return {
    ...base,
    name: value.companyName?.trim() ?? '',
    telephone1: value.companyPhone?.trim() ?? '',
    crNo: value.crNumber?.trim() ?? '',
  };
}

@Component({
  selector: 'app-add-account-modal',
  standalone: true,
  imports: [A11yModule, ReactiveFormsModule, FormlyModule, TranslateModule, ButtonComponent],
  templateUrl: './add-account-modal.component.html',
  styleUrl: './add-account-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAccountModalComponent {
  private readonly formlyService = inject(FormlyService);
  private readonly lookupApi = inject(LookupApi);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = input<boolean>(false);
  readonly submitting = input<boolean>(false);

  readonly closed = output<void>();
  readonly created = output<AddAccountFormValue>();

  readonly form = new FormGroup({});
  readonly companyForm = new FormGroup({});
  readonly formlyOptions: FormlyFormOptions = {};
  readonly fields: FormlyFieldConfig[] = (createAccountForm as unknown as FormlyFieldConfig[]).slice(
    0,
    COMPANY_FIELDS_START,
  );
  readonly companyFields: FormlyFieldConfig[] = (createAccountForm as unknown as FormlyFieldConfig[]).slice(
    COMPANY_FIELDS_START,
  );
  /** Both Formly forms share this single model so `companyName` / `crNumber` / etc.
   *  stay in one object even when the company section is toggled off. */
  readonly model: AddAccountFormValue = {
    accountType: 'personal',
    firstName: '',
    lastName: '',
    civilId: '',
    emailAddress: '',
    wilaya: '',
    address: '',
    phone: '',
    companyName: '',
    crNumber: '',
    companyPhone: '',
    companyAddress: '',
  };

  private readonly baseStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  private readonly companyStatus = toSignal(this.companyForm.statusChanges, {
    initialValue: this.companyForm.status,
  });
  /** Reactive snapshot of the base form value so `isOrganizationSelected` can
   *  re-compute the moment the toggle flips. */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });
  readonly isOrganizationSelected = computed(() => {
    const value = this.formValue() as { accountType?: string } | undefined;
    return value?.accountType === 'organization';
  });
  /** Combined validity: base fields always checked; company fields only when org is selected. */
  readonly isValid = computed(() => {
    const baseValid = this.baseStatus() === 'VALID';
    if (!this.isOrganizationSelected()) {
      return baseValid;
    }
    return baseValid && this.companyStatus() === 'VALID';
  });

  private readonly wilayaLookupResource = this.lookupApi.entityLookup(() =>
    this.isOpen()
      ? { entityName: 'ntw_alwilaya', columns: 'ntw_alwilayaid:id,ntw_name:name' }
      : null,
  );

  constructor() {
    effect(() => {
      const options = this.mapWilayaOptions(this.wilayaLookupResource.value()?.result);
      this.formlyService.setDropdownValue(this.fields, 'wilaya', options);
    });
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isOpen()) {
          this.wilayaLookupResource.reload();
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.onClose();
    }
  }

  onClose(): void {
    this.form.reset({ accountType: 'personal' });
    this.companyForm.reset();
    this.closed.emit();
  }

  onOverlayClick(): void {
    this.onClose();
  }

  onSubmit(): void {
    if (!this.isValid()) {
      this.form.markAllAsTouched();
      if (this.isOrganizationSelected()) {
        this.companyForm.markAllAsTouched();
      }
      return;
    }
    if (this.submitting()) {
      return;
    }
    this.created.emit(this.buildPayload());
  }

  private buildPayload(): AddAccountFormValue {
    const m = this.model;
    const base: AddAccountFormValue = {
      accountType: m.accountType,
      firstName: m.firstName,
      lastName: m.lastName,
      civilId: m.civilId,
      emailAddress: m.emailAddress,
      wilaya: m.wilaya,
      address: m.address,
      phone: m.phone,
    };
    if (m.accountType !== 'organization') {
      return base;
    }
    return {
      ...base,
      companyName: m.companyName,
      crNumber: m.crNumber,
      companyPhone: m.companyPhone,
      companyAddress: m.companyAddress,
    };
  }

  private mapWilayaOptions(entries: readonly LookupEntityOption[] | null | undefined): DropdownOption<string>[] {
    return (entries ?? []).map((entry) => ({ value: entry.id, label: entry.name }));
  }
}



