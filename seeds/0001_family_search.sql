INSERT INTO users (id, email, display_name, locale, created_at)
VALUES (
  'family',
  NULL,
  'Family',
  'en-US',
  '2026-08-25T00:00:00.000Z'
);

INSERT INTO saved_searches (
  id,
  user_id,
  name,
  enabled,
  config_json,
  created_at,
  updated_at
)
VALUES (
  'family-replacement-vehicle',
  'family',
  'Family replacement vehicle',
  1,
  '{"schemaVersion":1,"id":"family-replacement-vehicle","userId":"family","name":"Family replacement vehicle","enabled":true,"geography":{"center":{"label":"Kathy Ln, Cypress, TX","latitude":29.9691,"longitude":-95.6972},"radiusMiles":25},"budgets":{"cashTarget":10000,"stretchTarget":15000,"absoluteMax":17000},"filters":{"makes":["Honda","Toyota"],"models":["Odyssey","Pilot","Sienna","CR-V"],"minSeats":5,"titleStatuses":["clean"],"sellerTypes":["dealer","private"],"excludeNonRunning":true,"excludeUnresolvedMajorSafetyIssues":true},"preferences":{"vehicleTypeWeights":{"minivan":1,"three-row-suv":0.9,"two-row-suv":0.7,"sedan":0},"modelPreferences":[{"make":"Honda","model":"Odyssey","level":"primary","weight":1},{"make":"Honda","model":"Pilot","level":"primary","weight":1},{"make":"Toyota","model":"Sienna","level":"primary","weight":1},{"make":"Honda","model":"CR-V","level":"secondary","weight":0.7}],"mileageTargets":{"cashIdealMax":120000,"cashSoftMax":140000,"stretchIdealMax":100000,"stretchSoftMax":120000}},"scoring":{"vehicleWeights":{"reliabilityModelYearRisk":25,"maintenanceServiceHistory":20,"mileageRelativeToAge":15,"titleAccidentOwnershipHistory":15,"mechanicalPhysicalCondition":10,"familyVehicleRoleFit":10,"trimUsefulFeatures":5},"dealWeights":{"priceVsComparableListings":30,"effectivePurchaseCost":20,"vehicleScoreContribution":20,"priceVsSavedSearchBudget":10,"listingAgePriceMovement":8,"sellerConfidence":5,"distance":4,"listingCompletenessTransparency":3},"riskTolerance":"low"},"notifications":{"minimumVehicleScore":70,"minimumDealScore":75,"notifyOnNewListing":true,"notifyOnPriceDrop":true,"minimumPriceDrop":500},"workflow":{"purchaseDeadline":"2026-09-14","willingToTravelBeyondRadius":true,"privatePartyAllowed":true,"financingPreference":"acceptable","preferredInspectionProviderId":"corbs-auto-grand-rd-cypress-tx","immediateMaintenanceBudget":800}}',
  '2026-08-25T00:00:00.000Z',
  '2026-08-25T00:00:00.000Z'
);
