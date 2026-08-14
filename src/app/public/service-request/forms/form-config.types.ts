import { FormlyFieldConfig } from '@ngx-formly/core';

/**
 * Every section a service-request variant can render.
 *
 * All keys are non-optional — sections a variant doesn't use fall back to
 * empty arrays via the registry's `compose()` helper. This keeps templates
 * free of `?` chaining and `!` non-null assertions.
 *
 * Section-naming convention:
 *   - `customerInformation` — the first section (applicant/customer info).
 *     Variants can override the shared customer.section.json with their
 *     own applicant fields (e.g. NOC has different applicant lookups).
 *   - Water-specific sections use `existingPlot*` / `newPlotFields`.
 *   - Standard-specific plot section uses `existingPlotType234Fields`.
 *   - Tanker sections use the `tanker*` / `operator*` prefixes.
 *   - NOC sections use the `project*` / `noc*` prefixes.
 */
export interface ServiceRequestFormConfig {
  // ── Shared / applicant ─────────────────────────────────────────────────
  /** Default = customer.section.json. NOC overrides with its own applicant fields. */
  customerInformation: FormlyFieldConfig[];

  // ── Water variant ──────────────────────────────────────────────────────
  existingPlotType1Fields: FormlyFieldConfig[];
  newPlotFields: FormlyFieldConfig[];

  // ── Standard variant ───────────────────────────────────────────────────
  existingPlotType234Fields: FormlyFieldConfig[];

  // ── Shared (water + standard) ──────────────────────────────────────────
  requiredDocuments: FormlyFieldConfig[];

  // ── Tanker variant ─────────────────────────────────────────────────────
  tankerInformation: FormlyFieldConfig[];  vehicleInformation: FormlyFieldConfig[];  operatorDetails: FormlyFieldConfig[];
  tankerDocuments: FormlyFieldConfig[];

  // ── NOC variant ────────────────────────────────────────────────────────
  projectDetails: FormlyFieldConfig[];
  nocDocuments: FormlyFieldConfig[];
  // ── VAT Exemption variant ───────────────────────────────────────
  vatDetails: FormlyFieldConfig[];
  vatDocuments: FormlyFieldConfig[];

  // ── Violation Report variant ────────────────────────────────────
  /** Section 2: Customer Information (Contact + Customer Account lookups). */
  violationCustomerInfo: FormlyFieldConfig[];
  /** Section 3: Violation Details (type, details, statement, inspector, dateTime). */
  violationDetailFields: FormlyFieldConfig[];
  /** Section 4: Technical Affairs Department Report (proceduresFollowed). */
  technicalReportFields: FormlyFieldConfig[];
  /** Section 5: Documents (file upload + employee name). */
  violationDocumentFiles: FormlyFieldConfig[];
  /** Section 6: Administrative Penalties (currency fields). */
  administrativePenalties: FormlyFieldConfig[];
}
