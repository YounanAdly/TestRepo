import { FormlyFieldConfig } from '@ngx-formly/core';
import customerSection from './customer.section.json';
import { ServiceFormVariant } from './form-variant.enum';
import { ServiceRequestFormConfig } from './form-config.types';
import nocForm from './noc.form.json';
import standardForm from './standard.form.json';
import tankerForm from './tanker.form.json';
import vatForm from './vat.form.json';
import violationForm from './violation.form.json';
import waterForm from './water.form.json';

/**
 * Service-request form registry.
 *
 * Every variant declared in `ServiceFormVariant` has its own JSON file
 * next to this registry. This file just wires them together — no field
 * configs are declared inline (see [rules.md §Formly] and
 * [formly-forms.instructions.md]).
 *
 * ── Adding a new variant ──────────────────────────────────────────────
 *   1. Create `<variant>.form.json` with only the sections it uses.
 *   2. Add the variant to `ServiceFormVariant` (form-variant.enum.ts).
 *   3. Import + register it in `FORM_REGISTRY` below.
 *   4. Map affected `ServiceName` entries to the new variant in
 *      `service-catalog.ts`.
 *   5. Add the variant's rendering branch in
 *      `service-request.component.html` (`@switch` on
 *      `selectedServiceFormVariant()`).
 */

const EMPTY: FormlyFieldConfig[] = [];

/**
 * Merges the shared customer section with a variant's own sections.
 * Missing sections fall back to empty arrays so templates never have to
 * chain `?.` on `[fields]` inputs.
 */
function compose(variantJson: Partial<ServiceRequestFormConfig>): ServiceRequestFormConfig {
  const shared = customerSection as Partial<ServiceRequestFormConfig>;
  return {
    // Variant-provided customerInformation wins so NOC can supply its own
    // applicant fields instead of the shared customer-details block.
    customerInformation:       variantJson.customerInformation       ?? shared.customerInformation       ?? EMPTY,
    existingPlotType1Fields:   variantJson.existingPlotType1Fields   ?? EMPTY,
    newPlotFields:             variantJson.newPlotFields             ?? EMPTY,
    existingPlotType234Fields: variantJson.existingPlotType234Fields ?? EMPTY,
    requiredDocuments:         variantJson.requiredDocuments         ?? EMPTY,
    tankerInformation:         variantJson.tankerInformation         ?? EMPTY,
    vehicleInformation:        variantJson.vehicleInformation        ?? EMPTY,
    operatorDetails:           variantJson.operatorDetails           ?? EMPTY,
    tankerDocuments:           variantJson.tankerDocuments           ?? EMPTY,
    projectDetails:            variantJson.projectDetails            ?? EMPTY,
    nocDocuments:              variantJson.nocDocuments              ?? EMPTY,
    vatDetails:                variantJson.vatDetails                ?? EMPTY,
    vatDocuments:              variantJson.vatDocuments              ?? EMPTY,
    violationCustomerInfo:     variantJson.violationCustomerInfo     ?? EMPTY,
    violationDetailFields:     variantJson.violationDetailFields     ?? EMPTY,
    technicalReportFields:     variantJson.technicalReportFields     ?? EMPTY,
    violationDocumentFiles:    variantJson.violationDocumentFiles    ?? EMPTY,
    administrativePenalties:   variantJson.administrativePenalties   ?? EMPTY,
  };
}

export const FORM_REGISTRY: Record<ServiceFormVariant, ServiceRequestFormConfig> = {
  [ServiceFormVariant.Water]:    compose(waterForm    as Partial<ServiceRequestFormConfig>),
  [ServiceFormVariant.Standard]: compose(standardForm as Partial<ServiceRequestFormConfig>),
  [ServiceFormVariant.Tanker]:   compose(tankerForm   as Partial<ServiceRequestFormConfig>),
  [ServiceFormVariant.Noc]:      compose(nocForm      as Partial<ServiceRequestFormConfig>),
  [ServiceFormVariant.Vat]:      compose(vatForm      as Partial<ServiceRequestFormConfig>),
  [ServiceFormVariant.Violation]: compose(violationForm as Partial<ServiceRequestFormConfig>),
};
