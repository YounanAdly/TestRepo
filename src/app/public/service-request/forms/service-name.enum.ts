/**
 * Backend service categorization number (1..15) returned by
 * `/api/v1/home-page/services-card/{id}` in the `serviceName` field.
 *
 * Every service in the Marafiq catalog maps to exactly one entry here.
 * Add a new enum member when the backend adds a new service number, then
 * register its form variant + title in `service-catalog.ts`.
 */
export enum ServiceName {
  WaterConnection = 1,
  AdditionalMeter = 2,
  MeterRelocation = 3,
  PermanentDisconnection = 4,
  DataUpdate = 5,
  NOC = 6,
  VatExemption = 7,
  TankerFilling = 8,
  ViolationReport = 9,
  FireHydrantRelocation = 10,
  Inquiry = 11,
  WaterLeakage = 12,
  WaterQuality = 13,
  GeneralComplaints = 14,
  Commercial = 15,
}

/** Runtime type guard for `ServiceName`. */
export function isServiceName(value: unknown): value is ServiceName {
  return typeof value === 'number'
    && Number.isInteger(value)
    && (Object.values(ServiceName) as unknown[]).includes(value);
}

/**
 * Parse an unknown numeric input into a `ServiceName`, or `null` when the
 * value is out of range / not an integer. Safe for query-param inputs.
 */
export function toServiceName(value: number | string | undefined | null): ServiceName | null {
  const parsed = typeof value === 'string' ? Number(value) : value ?? Number.NaN;
  return isServiceName(parsed) ? parsed : null;
}
