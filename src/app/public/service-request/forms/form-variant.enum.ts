/**
 * Form template variant rendered by the service-request page.
 *
 * Multiple `ServiceName` values can share a variant. For example, meter,
 * disconnection, and data-update all use `Standard`. NOC has its own
 * project-oriented layout, so it gets its own variant.
 *
 * Add a new variant only when the form's structure genuinely differs from
 * every existing one. Otherwise, map the new `ServiceName` to an existing
 * variant in `service-catalog.ts`.
 */
export enum ServiceFormVariant {
  Water     = 'water',
  Standard  = 'standard',
  Tanker    = 'tanker',
  Noc       = 'noc',
  Vat       = 'vat',
  Violation = 'violation',
}
