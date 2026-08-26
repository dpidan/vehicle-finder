export const SAVED_SEARCH_CONFIG_VERSION = 1;

export type RiskTolerance = 'low' | 'moderate' | 'high';

export type SellerType = 'dealer' | 'private';

export type TitleStatus =
  | 'clean'
  | 'salvage'
  | 'rebuilt'
  | 'flood'
  | 'lemon-buyback'
  | 'odometer-discrepancy'
  | 'unknown';

export type VehicleType =
  | 'minivan'
  | 'three-row-suv'
  | 'two-row-suv'
  | 'sedan'
  | 'truck'
  | 'wagon'
  | 'other';

export type ModelPreferenceLevel =
  | 'primary'
  | 'secondary'
  | 'acceptable'
  | 'avoid';

export type FeaturePreferenceImportance = 'required' | 'preferred' | 'bonus';

export interface SavedSearchConfig {
  schemaVersion: typeof SAVED_SEARCH_CONFIG_VERSION;
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  geography: SearchGeography;
  budgets: SearchBudgets;
  filters: SearchFilters;
  preferences: SearchPreferences;
  scoring: SearchScoring;
  notifications: SearchNotifications;
  workflow?: SearchWorkflow;
}

export interface SearchGeography {
  center: {
    label: string;
    latitude: number;
    longitude: number;
  };
  radiusMiles: number;
}

export interface SearchBudgets {
  cashTarget?: number;
  stretchTarget?: number;
  absoluteMax?: number;
}

export interface SearchFilters {
  makes?: string[];
  models?: string[];
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  minSeats?: number;
  titleStatuses?: TitleStatus[];
  sellerTypes?: SellerType[];
  excludeNonRunning?: boolean;
  excludeUnresolvedMajorSafetyIssues?: boolean;
}

export interface SearchPreferences {
  vehicleTypeWeights: Partial<Record<VehicleType, number>>;
  modelPreferences: ModelPreference[];
  mileageTargets?: MileageTargets;
  featurePreferences?: FeaturePreference[];
}

export interface ModelPreference {
  make: string;
  model: string;
  level: ModelPreferenceLevel;
  minYear?: number;
  maxYear?: number;
  weight?: number;
}

export interface MileageTargets {
  cashIdealMax?: number;
  cashSoftMax?: number;
  stretchIdealMax?: number;
  stretchSoftMax?: number;
}

export interface FeaturePreference {
  name: string;
  importance: FeaturePreferenceImportance;
  weight?: number;
}

export interface SearchScoring {
  vehicleWeights: VehicleScoreWeights;
  dealWeights: DealScoreWeights;
  riskTolerance: RiskTolerance;
}

export interface VehicleScoreWeights {
  reliabilityModelYearRisk: number;
  maintenanceServiceHistory: number;
  mileageRelativeToAge: number;
  titleAccidentOwnershipHistory: number;
  mechanicalPhysicalCondition: number;
  familyVehicleRoleFit: number;
  trimUsefulFeatures: number;
}

export interface DealScoreWeights {
  priceVsComparableListings: number;
  effectivePurchaseCost: number;
  vehicleScoreContribution: number;
  priceVsSavedSearchBudget: number;
  listingAgePriceMovement: number;
  sellerConfidence: number;
  distance: number;
  listingCompletenessTransparency: number;
}

export interface SearchNotifications {
  minimumVehicleScore?: number;
  minimumDealScore?: number;
  notifyOnNewListing?: boolean;
  notifyOnPriceDrop?: boolean;
  minimumPriceDrop?: number;
}

export interface SearchWorkflow {
  purchaseDeadline?: string;
  willingToTravelBeyondRadius?: boolean;
  privatePartyAllowed?: boolean;
  financingPreference?: 'avoid' | 'acceptable' | 'preferred';
  preferredInspectionProviderId?: string;
  immediateMaintenanceBudget?: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export const familySearchDefaults: SavedSearchConfig = {
  schemaVersion: SAVED_SEARCH_CONFIG_VERSION,
  id: 'family-replacement-vehicle',
  userId: 'family',
  name: 'Family replacement vehicle',
  enabled: true,
  geography: {
    center: {
      label: 'Happy Ln, Cypress, TX',
      latitude: 29.9691,
      longitude: -95.6972
    },
    radiusMiles: 25
  },
  budgets: {
    cashTarget: 10000,
    stretchTarget: 15000,
    absoluteMax: 17000
  },
  filters: {
    makes: ['Honda', 'Toyota'],
    models: ['Odyssey', 'Pilot', 'Sienna', 'CR-V'],
    minSeats: 5,
    titleStatuses: ['clean'],
    sellerTypes: ['dealer', 'private'],
    excludeNonRunning: true,
    excludeUnresolvedMajorSafetyIssues: true
  },
  preferences: {
    vehicleTypeWeights: {
      minivan: 1,
      'three-row-suv': 0.9,
      'two-row-suv': 0.7,
      sedan: 0
    },
    modelPreferences: [
      { make: 'Honda', model: 'Odyssey', level: 'primary', weight: 1 },
      { make: 'Honda', model: 'Pilot', level: 'primary', weight: 1 },
      { make: 'Toyota', model: 'Sienna', level: 'primary', weight: 1 },
      { make: 'Honda', model: 'CR-V', level: 'secondary', weight: 0.7 }
    ],
    mileageTargets: {
      cashIdealMax: 120000,
      cashSoftMax: 140000,
      stretchIdealMax: 100000,
      stretchSoftMax: 120000
    }
  },
  scoring: {
    vehicleWeights: {
      reliabilityModelYearRisk: 25,
      maintenanceServiceHistory: 20,
      mileageRelativeToAge: 15,
      titleAccidentOwnershipHistory: 15,
      mechanicalPhysicalCondition: 10,
      familyVehicleRoleFit: 10,
      trimUsefulFeatures: 5
    },
    dealWeights: {
      priceVsComparableListings: 30,
      effectivePurchaseCost: 20,
      vehicleScoreContribution: 20,
      priceVsSavedSearchBudget: 10,
      listingAgePriceMovement: 8,
      sellerConfidence: 5,
      distance: 4,
      listingCompletenessTransparency: 3
    },
    riskTolerance: 'low'
  },
  notifications: {
    minimumVehicleScore: 70,
    minimumDealScore: 75,
    notifyOnNewListing: true,
    notifyOnPriceDrop: true,
    minimumPriceDrop: 500
  },
  workflow: {
    purchaseDeadline: '2026-09-14',
    willingToTravelBeyondRadius: true,
    privatePartyAllowed: true,
    financingPreference: 'acceptable',
    preferredInspectionProviderId: 'corbs-auto-grand-rd-cypress-tx',
    immediateMaintenanceBudget: 800
  }
};

export function validateSavedSearchConfig(config: SavedSearchConfig): ValidationResult {
  const issues: ValidationIssue[] = [];

  requirePositiveInteger(config.schemaVersion, 'schemaVersion', issues);
  requireNonBlank(config.id, 'id', issues);
  requireNonBlank(config.userId, 'userId', issues);
  requireNonBlank(config.name, 'name', issues);

  if (config.schemaVersion !== SAVED_SEARCH_CONFIG_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Expected schema version ${SAVED_SEARCH_CONFIG_VERSION}.`
    });
  }

  requireLatitude(config.geography.center.latitude, 'geography.center.latitude', issues);
  requireLongitude(config.geography.center.longitude, 'geography.center.longitude', issues);
  requireNonBlank(config.geography.center.label, 'geography.center.label', issues);
  requirePositiveNumber(config.geography.radiusMiles, 'geography.radiusMiles', issues);

  requireOptionalPositiveNumber(config.budgets.cashTarget, 'budgets.cashTarget', issues);
  requireOptionalPositiveNumber(config.budgets.stretchTarget, 'budgets.stretchTarget', issues);
  requireOptionalPositiveNumber(config.budgets.absoluteMax, 'budgets.absoluteMax', issues);
  requireOrderedBudget(config, issues);

  requireOptionalPositiveInteger(config.filters.minYear, 'filters.minYear', issues);
  requireOptionalPositiveInteger(config.filters.maxYear, 'filters.maxYear', issues);
  requireOptionalPositiveInteger(config.filters.maxMileage, 'filters.maxMileage', issues);
  requireOptionalPositiveInteger(config.filters.minSeats, 'filters.minSeats', issues);
  requireOrderedRange(config.filters.minYear, config.filters.maxYear, 'filters.minYear', 'filters.maxYear', issues);

  requireWeightMap(config.preferences.vehicleTypeWeights, 'preferences.vehicleTypeWeights', issues);
  config.preferences.modelPreferences.forEach((preference, index) => {
    requireNonBlank(preference.make, `preferences.modelPreferences.${index}.make`, issues);
    requireNonBlank(preference.model, `preferences.modelPreferences.${index}.model`, issues);
    requireOptionalPositiveInteger(preference.minYear, `preferences.modelPreferences.${index}.minYear`, issues);
    requireOptionalPositiveInteger(preference.maxYear, `preferences.modelPreferences.${index}.maxYear`, issues);
    requireOptionalWeight(preference.weight, `preferences.modelPreferences.${index}.weight`, issues);
    requireOrderedRange(
      preference.minYear,
      preference.maxYear,
      `preferences.modelPreferences.${index}.minYear`,
      `preferences.modelPreferences.${index}.maxYear`,
      issues
    );
  });

  if (config.preferences.mileageTargets) {
    requireOptionalPositiveInteger(
      config.preferences.mileageTargets.cashIdealMax,
      'preferences.mileageTargets.cashIdealMax',
      issues
    );
    requireOptionalPositiveInteger(
      config.preferences.mileageTargets.cashSoftMax,
      'preferences.mileageTargets.cashSoftMax',
      issues
    );
    requireOptionalPositiveInteger(
      config.preferences.mileageTargets.stretchIdealMax,
      'preferences.mileageTargets.stretchIdealMax',
      issues
    );
    requireOptionalPositiveInteger(
      config.preferences.mileageTargets.stretchSoftMax,
      'preferences.mileageTargets.stretchSoftMax',
      issues
    );
  }

  config.preferences.featurePreferences?.forEach((preference, index) => {
    requireNonBlank(preference.name, `preferences.featurePreferences.${index}.name`, issues);
    requireOptionalWeight(preference.weight, `preferences.featurePreferences.${index}.weight`, issues);
  });

  requireWeightTotal(config.scoring.vehicleWeights, 'scoring.vehicleWeights', issues);
  requireWeightTotal(config.scoring.dealWeights, 'scoring.dealWeights', issues);

  requireOptionalScore(config.notifications.minimumVehicleScore, 'notifications.minimumVehicleScore', issues);
  requireOptionalScore(config.notifications.minimumDealScore, 'notifications.minimumDealScore', issues);
  requireOptionalPositiveNumber(config.notifications.minimumPriceDrop, 'notifications.minimumPriceDrop', issues);
  requireOptionalPositiveNumber(config.workflow?.immediateMaintenanceBudget, 'workflow.immediateMaintenanceBudget', issues);

  return {
    valid: issues.length === 0,
    issues
  };
}

function requireNonBlank(value: string, path: string, issues: ValidationIssue[]): void {
  if (value.trim().length === 0) {
    issues.push({ path, message: 'Must not be blank.' });
  }
}

function requireLatitude(value: number, path: string, issues: ValidationIssue[]): void {
  if (value < -90 || value > 90) {
    issues.push({ path, message: 'Must be between -90 and 90.' });
  }
}

function requireLongitude(value: number, path: string, issues: ValidationIssue[]): void {
  if (value < -180 || value > 180) {
    issues.push({ path, message: 'Must be between -180 and 180.' });
  }
}

function requirePositiveNumber(value: number, path: string, issues: ValidationIssue[]): void {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({ path, message: 'Must be a positive number.' });
  }
}

function requireOptionalPositiveNumber(value: number | undefined, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined) {
    requirePositiveNumber(value, path, issues);
  }
}

function requirePositiveInteger(value: number, path: string, issues: ValidationIssue[]): void {
  if (!Number.isInteger(value) || value <= 0) {
    issues.push({ path, message: 'Must be a positive integer.' });
  }
}

function requireOptionalPositiveInteger(value: number | undefined, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined) {
    requirePositiveInteger(value, path, issues);
  }
}

function requireOrderedBudget(config: SavedSearchConfig, issues: ValidationIssue[]): void {
  const { cashTarget, stretchTarget, absoluteMax } = config.budgets;

  if (cashTarget !== undefined && stretchTarget !== undefined && cashTarget > stretchTarget) {
    issues.push({
      path: 'budgets.cashTarget',
      message: 'Must be less than or equal to stretchTarget.'
    });
  }

  if (stretchTarget !== undefined && absoluteMax !== undefined && stretchTarget > absoluteMax) {
    issues.push({
      path: 'budgets.stretchTarget',
      message: 'Must be less than or equal to absoluteMax.'
    });
  }
}

function requireOrderedRange(
  minimum: number | undefined,
  maximum: number | undefined,
  minimumPath: string,
  maximumPath: string,
  issues: ValidationIssue[]
): void {
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    issues.push({
      path: minimumPath,
      message: `Must be less than or equal to ${maximumPath}.`
    });
  }
}

function requireOptionalScore(value: number | undefined, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) {
    issues.push({ path, message: 'Must be between 0 and 100.' });
  }
}

function requireOptionalWeight(value: number | undefined, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) {
    issues.push({ path, message: 'Must be between 0 and 1.' });
  }
}

function requireWeightMap(
  weights: Partial<Record<string, number>>,
  path: string,
  issues: ValidationIssue[]
): void {
  Object.entries(weights).forEach(([key, value]) => {
    requireOptionalWeight(value, `${path}.${key}`, issues);
  });
}

function requireWeightTotal<TWeights extends object>(weights: TWeights, path: string, issues: ValidationIssue[]): void {
  const entries = Object.entries(weights) as Array<[string, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

  entries.forEach(([key, value]) => {
    if (!Number.isFinite(value) || value < 0) {
      issues.push({ path: `${path}.${key}`, message: 'Must be zero or greater.' });
    }
  });

  if (total !== 100) {
    issues.push({ path, message: `Weights must total 100; received ${total}.` });
  }
}
