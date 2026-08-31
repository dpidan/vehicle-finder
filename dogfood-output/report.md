# Dashboard Dogfood Report

Date: 2026-08-31 12:09 CDT
Target: http://127.0.0.1:5173/app
Browser session: vehicle-dashboard-qa

## Summary

- Tested dashboard load, listing selection, compare, manual import validation/preview, admin-token prompt path, console errors, and a 390px mobile viewport.
- Fixed 1 minor accessibility issue during the pass.
- Larger issues to schedule separately: 2 medium UX/layout issues.
- Browser errors: none observed.

## Fixed During Pass

### FIX-001: Listing table and compare table repeated vehicle names

Severity: Low
Status: Fixed
Evidence:
- Before: `dogfood-output/screenshots/initial-dashboard.png`
- After: `dogfood-output/screenshots/post-fix-dashboard.png`

The accessibility snapshot announced cells such as `2010 Ford Edge 2010 Ford Edge` because the listing title and derived vehicle label were identical. I changed the ranked listing and comparison rows to show the secondary vehicle label only when it differs from the title.

## Larger Issues

### ISSUE-001: Admin actions use blocking token prompts

Severity: Medium
Evidence: `dogfood-output/screenshots/admin-token-prompt.png`

Steps:
1. Open `/app`.
2. Click Source feeds `Load`.
3. The browser opens a blocking JavaScript prompt asking for `Admin token`.

Impact:
The prompt blocks the whole dashboard, cannot be styled, gives no context about why admin access is needed, and makes related controls feel abrupt. This same pattern is used by refresh, source feed actions, VIN decode, and recall lookup. Replace with an in-dashboard admin-token control or authenticated admin mode so protected workflows are visible and recoverable.

### ISSUE-002: Ranked listings table is cramped on phone-width screens

Severity: Medium
Evidence: `dogfood-output/screenshots/mobile-dashboard-full.png`

Steps:
1. Open `/app`.
2. Set viewport to 390px wide.
3. Scroll to Ranked listings.

Impact:
The page avoids global horizontal overflow, but the listing table compresses into narrow columns. Titles wrap into tiny fragments, right-side columns are hard to scan, and the workflow controls lose the quick comparison value of the desktop table. Consider a mobile-specific listing card row or fewer visible columns with detail disclosure.

## Healthy Paths Observed

- Dashboard loads seeded search and 5 ranked listings.
- Monitoring summary loads without browser errors.
- Listing `View` changes the detail panel.
- Compare checkbox adds a candidate to the comparison panel.
- Empty manual import submission uses native required-field validation.
- Minimal manual import preview produces a `Save import` action.

## Evidence Files

- `dogfood-output/screenshots/initial-dashboard.png`
- `dogfood-output/screenshots/compare-and-detail.png`
- `dogfood-output/screenshots/admin-token-prompt.png`
- `dogfood-output/screenshots/manual-import-required-validation.png`
- `dogfood-output/screenshots/manual-import-preview-result.png`
- `dogfood-output/screenshots/mobile-dashboard-full.png`
- `dogfood-output/screenshots/post-fix-dashboard.png`
