import { ServiceFormVariant } from './form-variant.enum';
import { ServiceName } from './service-name.enum';

/**
 * Static metadata for a single service in the Marafiq catalog.
 *
 * `variant` selects which form-template branch renders on the request page.
 * `titleKey` is the ngx-translate key used as the immediate H1/breadcrumb
 * label — the API's `serviceCardTitleEnglish` / `name` (Arabic) supersedes
 * this once the `/services-card` call resolves.
 * `slug` is a stable back-compat identifier so older links using
 * `?service=connection` (etc.) still resolve.
 */
export interface ServiceMetadata {
  variant: ServiceFormVariant;
  titleKey: string;
  slug: string;
}

/**
 * Single source of truth for every service Marafiq exposes on the
 * request page. To add a new service:
 *   1. Add a member to `ServiceName`.
 *   2. Add its entry here (variant + titleKey + slug).
 *   3. If the form differs from every existing variant, add a member to
 *      `ServiceFormVariant` and register the new form JSON in
 *      `registry.ts`.
 */
export const SERVICE_CATALOG: Record<ServiceName, ServiceMetadata> = {
  [ServiceName.WaterConnection]:        { variant: ServiceFormVariant.Water,    titleKey: 'home.services.cards.connection.title',              slug: 'connection'         },
  [ServiceName.AdditionalMeter]:        { variant: ServiceFormVariant.Standard, titleKey: 'home.services.cards.meter.title',                   slug: 'meter'              },
  [ServiceName.MeterRelocation]:        { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.meterRelocation.title', slug: 'meter-relocation'   },
  [ServiceName.PermanentDisconnection]: { variant: ServiceFormVariant.Standard, titleKey: 'home.services.cards.disconnection.title',           slug: 'disconnection'      },
  [ServiceName.DataUpdate]:             { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.dataUpdate.title',      slug: 'data-update'        },
  [ServiceName.NOC]:                    { variant: ServiceFormVariant.Noc,      titleKey: 'serviceRequestPage.services.noc.title',             slug: 'noc'                },
  [ServiceName.VatExemption]:           { variant: ServiceFormVariant.Vat,      titleKey: 'serviceRequestPage.services.vat.title',             slug: 'vat'                },
  [ServiceName.TankerFilling]:          { variant: ServiceFormVariant.Tanker,   titleKey: 'home.services.cards.tanker.title',                  slug: 'tanker'             },
  [ServiceName.ViolationReport]:        { variant: ServiceFormVariant.Violation, titleKey: 'serviceRequestPage.services.violation.title',      slug: 'violation'          },
  [ServiceName.FireHydrantRelocation]:  { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.fireHydrant.title',     slug: 'fire-hydrant'       },
  [ServiceName.Inquiry]:                { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.inquiry.title',         slug: 'inquiry'            },
  [ServiceName.WaterLeakage]:           { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.waterLeakage.title',    slug: 'water-leakage'      },
  [ServiceName.WaterQuality]:           { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.waterQuality.title',    slug: 'water-quality'      },
  [ServiceName.GeneralComplaints]:      { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.generalComplaints.title', slug: 'general-complaints' },
  [ServiceName.Commercial]:             { variant: ServiceFormVariant.Standard, titleKey: 'serviceRequestPage.services.commercial.title',      slug: 'commercial'         },
};

/**
 * Reverse index for legacy slug-based routing. Built once at module load.
 * O(1) lookup by `service=<slug>` query param.
 */
const CATALOG_BY_SLUG: ReadonlyMap<string, { serviceName: ServiceName; metadata: ServiceMetadata }> =
  new Map(
    (Object.entries(SERVICE_CATALOG) as [string, ServiceMetadata][]).map(([key, meta]) => [
      meta.slug,
      { serviceName: Number(key) as ServiceName, metadata: meta },
    ]),
  );

/** Returns the metadata for a `ServiceName`, or `null` if not registered. */
export function getServiceMetadata(name: ServiceName | null | undefined): ServiceMetadata | null {
  if (name == null) return null;
  return SERVICE_CATALOG[name] ?? null;
}

/**
 * Resolves a legacy slug (e.g. `tanker`, `meter-relocation`) into its
 * `ServiceName` + metadata. Returns `null` for unknown slugs.
 */
export function getServiceByLegacySlug(
  slug: string | null | undefined,
): { serviceName: ServiceName; metadata: ServiceMetadata } | null {
  if (!slug) return null;
  return CATALOG_BY_SLUG.get(slug.toLowerCase()) ?? null;
}

/** Dataverse GUID regex — matches the `service=<guid>` query-param form. */
const GUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/** Returns true if the given string is shaped like a Dataverse GUID. */
export function isServiceGuid(value: string | null | undefined): boolean {
  return !!value && GUID_PATTERN.test(value);
}

/** Default fallback used when the query param resolves to nothing. */
export const DEFAULT_SERVICE_NAME: ServiceName = ServiceName.WaterConnection;
