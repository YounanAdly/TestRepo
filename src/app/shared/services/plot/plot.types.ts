import { ApiEnvelope } from '../auth/auth.types';

/** A single plot row returned from `/api/v1/services/plots`. */
export interface PlotItem {
  plotId: string;
  name: string;
  plotNumber: string | null;
  serialSketchNumber: string | null;
  alWilayaId: string | null;
  alWilayaName: string | null;
  regionVillageId: string | null;
  regionVillageName: string | null;
  landArea: number | null;
  landNumber: string | null;
  premisesType: number | null;
  latitude: number | null;
  longitude: number | null;
  relatedWaterServiceRequestId: string | null;
  relatedWaterServiceRequestName: string | null;
  functionalLocationId: string | null;
  functionalLocationName: string | null;
  customerAccountId: string | null;
  customerAccountName: string | null;
  customerContactId: string | null;
  customerContactName: string | null;
}

export type PlotsResponse = ApiEnvelope<PlotItem[]>;
