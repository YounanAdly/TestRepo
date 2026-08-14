/**
 * Barrel export for the service-request forms module.
 *
 * Consumers (currently just `service-request.component.ts`) should import
 * only from this file, never reach into individual submodules. That keeps
 * the public surface of the feature small and refactorable.
 */
export { ServiceName, isServiceName, toServiceName } from './service-name.enum';
export { ServiceFormVariant } from './form-variant.enum';
export type { ServiceMetadata } from './service-catalog';
export {
  SERVICE_CATALOG,
  DEFAULT_SERVICE_NAME,
  getServiceMetadata,
  getServiceByLegacySlug,
  isServiceGuid,
} from './service-catalog';
export type { ServiceRequestFormConfig } from './form-config.types';
export { FORM_REGISTRY } from './registry';
