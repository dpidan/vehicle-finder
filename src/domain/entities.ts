import type { SavedSearchConfig, SellerType, TitleStatus } from './search-config.js';

export type EntityId = string;
export type IsoDateTime = string;
export type CurrencyCode = 'USD';
export type LocaleCode = string;

export type ListingStatus = 'active' | 'pending' | 'sold' | 'removed' | 'unknown';
export type SourceAccess = 'official-api' | 'structured-web' | 'notification-import' | 'browser-assisted' | 'manual-import';

export type ListingDispositionState =
  | 'new'
  | 'interested'
  | 'favorite'
  | 'contacted'
  | 'inspection'
  | 'rejected'
  | 'sold';

export type NextActionType =
  | 'request-vin'
  | 'ask-maintenance-records'
  | 'ask-out-the-door-price'
  | 'schedule-inspection'
  | 'follow-up'
  | 'compare'
  | 'none';

export interface User {
  id: EntityId;
  email?: string;
  displayName: string;
  locale?: LocaleCode;
  createdAt: IsoDateTime;
}

export interface SavedSearch {
  id: EntityId;
  userId: EntityId;
  name: string;
  enabled: boolean;
  config: SavedSearchConfig;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Vehicle {
  id: EntityId;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Seller {
  id: EntityId;
  type: SellerType;
  name: string;
  phone?: string;
  websiteUrl?: string;
  location?: GeoPoint;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Listing {
  id: EntityId;
  vehicleId: EntityId;
  sellerId?: EntityId;
  source: ListingSourceRef;
  sourceListingId?: string;
  url: string;
  title: string;
  status: ListingStatus;
  price?: MoneyAmount;
  mileage?: number;
  titleStatus?: TitleStatus;
  location?: GeoPoint;
  firstSeenAt: IsoDateTime;
  lastSeenAt: IsoDateTime;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface ListingSnapshot {
  id: EntityId;
  listingId: EntityId;
  capturedAt: IsoDateTime;
  price?: MoneyAmount;
  mileage?: number;
  status: ListingStatus;
  rawTitle?: string;
  rawDescription?: string;
}

export interface SearchEvaluation {
  id: EntityId;
  savedSearchId: EntityId;
  listingId: EntityId;
  vehicleId: EntityId;
  scoreVersion: string;
  vehicleScore: number;
  dealScore: number;
  factors: ScoreFactor[];
  flags: string[];
  evaluatedAt: IsoDateTime;
}

export interface ScoreFactor {
  key: string;
  messageKey: string;
  messageParams?: Record<string, string | number | boolean>;
  scoreImpact: number;
  evidenceIds?: EntityId[];
}

export interface ListingDisposition {
  id: EntityId;
  savedSearchId: EntityId;
  listingId: EntityId;
  state: ListingDispositionState;
  rejectionReason?: string;
  nextAction?: NextAction;
  updatedAt: IsoDateTime;
}

export interface NextAction {
  type: NextActionType;
  dueAt?: IsoDateTime;
  note?: string;
}

export type AttributeOwnerType = 'vehicle' | 'listing' | 'seller' | 'evaluation';
export type AttributeValueType = 'string' | 'number' | 'boolean' | 'date' | 'json';

export interface AttributeDefinition {
  id: EntityId;
  key: string;
  label: string;
  ownerType: AttributeOwnerType;
  valueType: AttributeValueType;
  version: number;
}

export interface AttributeValue {
  id: EntityId;
  definitionId: EntityId;
  ownerType: AttributeOwnerType;
  ownerId: EntityId;
  value: string | number | boolean | Record<string, unknown>;
  evidenceIds?: EntityId[];
  createdAt: IsoDateTime;
}

export interface EvidenceRecord {
  id: EntityId;
  source: ListingSourceRef;
  url?: string;
  label?: string;
  capturedAt: IsoDateTime;
  confidence?: number;
}

export interface ListingSourceRef {
  name: string;
  access: SourceAccess;
}

export interface MoneyAmount {
  amount: number;
  currency: CurrencyCode;
}

export interface GeoPoint {
  label?: string;
  latitude: number;
  longitude: number;
}
