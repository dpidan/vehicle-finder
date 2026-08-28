# Dealer Seed Review — 2026-08-28

## Result

The first live-data seed list is usable and now covers multiple Dealer Car Search sites.

- Healthy automated seeds: Trade Lane Motors, Future Cars, Texaz Motors, CarCafe LLC, and C.P. Auto Sales via Dealer Car Search.
- Verified command: `npm run collect:dealer-car-search`.
- Verified result on 2026-08-28 after expansion: 49 normalized listings with VIN, price, mileage, seller, and source detail URL.

## Reviewed Seeds

Carsforsale seeds remain useful research targets, but they are not currently healthy for plain fetch collection.

- VSA MotorCars Carsforsale profile: HTTP 403.
- Auto Land Of Texas Carsforsale profile: HTTP 403.
- 501 Motors Carsforsale profile: HTTP 403.
- I 90 Motors dealer site inventory: HTTP 403.

Additional clean Dealer Car Search inventory URLs were found during the 2026-08-28 source expansion pass:

- Future Cars: `https://www.futurecarus.com/newandusedcars?clearall=1`.
- Texaz Motors: `https://texazmotors.com/newandusedcars?clearall=1`.
- CarCafe LLC: `https://www.carcafe-tx.com/newandusedcars?clearall=1`.
- C.P. Auto Sales: `https://www.cpautosale.com/newandusedcars?clearall=1`.

## Decision

Keep the healthy Dealer Car Search seeds in the automated refresh path. Do not expand the live refresh path with sources that currently return HTTP 403 from plain fetch.

## Follow-up

To improve coverage further, either find more nearby Dealer Car Search dealers manually or choose the next permitted platform adapter from the existing local dealer research.
