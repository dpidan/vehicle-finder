# Dealer Seed Review — 2026-08-28

## Result

The first live-data seed is usable but thin.

- Healthy automated seed: Trade Lane Motors via Dealer Car Search.
- Verified command: `npm run collect:dealer-car-search`.
- Verified result: 25 normalized listings with VIN, price, mileage, seller, and source URL.

## Reviewed Seeds

Carsforsale seeds remain useful research targets, but they are not currently healthy for plain fetch collection.

- VSA MotorCars Carsforsale profile: HTTP 403.
- Auto Land Of Texas Carsforsale profile: HTTP 403.
- 501 Motors Carsforsale profile: HTTP 403.
- I 90 Motors dealer site inventory: HTTP 403.

No additional clean Dealer Car Search inventory URLs were found during the 2026-08-28 seed review.

## Decision

Keep Trade Lane Motors as the only automated first-refresh seed. Do not expand the live refresh path with sources that currently return HTTP 403 from plain fetch.

## Follow-up

To improve coverage, either find more nearby Dealer Car Search dealers manually or choose the next permitted platform adapter from the existing local dealer research.
