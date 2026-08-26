# Local Dealer Platform Research — Cypress, TX

Research date: 2026-08-26

## Goal

Find a compliant, practical first live-data target near Cypress, TX for the
family vehicle search.

## Findings

Carsforsale.com-backed independent dealer inventory pages are the best first
adapter target.

Reasons:

- Multiple Cypress-area dealers use the same listing page shape.
- Search-result pages expose listing title, price, mileage, drivetrain, engine,
  exterior color, dealer name, address, phone, and detail links in HTML.
- The pages are useful without browser automation.
- The platform is common enough locally to test adapter reuse before handling
  franchise dealer platforms.

Observed Cypress-area Carsforsale.com inventory pages:

| Dealer | Evidence | Notes |
|---|---|---|
| VSA MotorCars | https://www.vsamotorcars.com/cars-for-sale | Cypress address, showed 36 vehicles on the dealer site and visible Honda/Toyota filters/listings during research. |
| VSA MotorCars on Carsforsale.com | https://www.carsforsale.com/used-car-dealer/vsa-motorcars-cypress-tx-d477384 | Carsforsale.com dealer profile showed 30 vehicles and the same dealer address. |
| Auto Land Of Texas | https://www.autolandoftexas.com/cars-for-sale | Dealer site footer shows `Powered by Carsforsale.com`. |
| Auto Land Of Texas on Carsforsale.com | https://www.carsforsale.com/used-car-dealer/auto-land-of-texas-cypress-tx-d647793 | Carsforsale.com dealer profile showed roughly 39 vehicles from Cypress, TX. |
| Jason Auto Sales | https://www.jasonautosalestx.com/toyota/corolla%2Bcross%2Bhybrid-for-sale | Carsforsale.com-powered dealer site with Honda/Toyota sample inventory in Cypress. |
| 501 Motors | https://www.carsforsale.com/used-car-dealer/501-motors-cypress-tx-d737118 | Carsforsale.com profile for a Cypress dealer with 56 vehicles. |
| I 90 Motors | https://www.i90motorstx.com/suvs-for-sale-b100037 | Page footer shows `Powered by Carsforsale.com`; SUV inventory includes family-relevant models. |
| Southwest Bus Sales | https://www.swbussales.com/cars-for-sale | Carsforsale.com-powered but not useful for the initial family search because inventory is mostly buses/chassis. |

Franchise/dealer-group pages are still useful as future targets, but should not
be first:

- Toyota's Cypress dealer locator lists nearby franchise dealers such as Fred
  Haas Toyota Country, Joe Myers Toyota, Toyota of Katy, Don McGill Toyota, and
  Fred Haas Toyota World:
  https://www.toyota.com/dealers/texas/cypress/dealers/
- Mossy Nissan's used inventory page near Cypress exposed detailed used listing
  data, including VIN, price, doc fee, mileage, and stock number:
  https://www.mossynissanhouston.com/used-cars-cypress-tx
- Easy Honda has a used Honda search page near Cypress:
  https://www.easyhonda.com/search/used-honda-cypress-tx/?cy=77429&mk=23&tp=used

## Recommendation

Implement the first compliant dealer adapter against dealer-owned
Carsforsale.com-powered inventory pages, starting with `cars-for-sale` pages.

Initial adapter inputs should be explicit dealer seeds:

- dealer name;
- inventory URL;
- seller type;
- optional address/location.

Automated dealer discovery can wait. A seed list is enough to connect live data
without overbuilding discovery.

## Risks

- Availability and prices can change quickly; every imported listing must retain
  source URL and capture timestamp.
- Some fields, especially VIN and fees, may only appear on detail pages.
- Respect robots.txt, published terms, rate limits, and ordinary low-frequency
  family-use collection. Do not add anti-bot bypass behavior.
