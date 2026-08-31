# Operator Imports

Use this when a useful listing source cannot be collected directly, or when a human/browser-assisted workflow is safer than scheduled scraping.

## Dashboard Format

The dashboard Bulk import panel accepts JSON or CSV. CSV is easiest for quick operator use:

```csv
url,title,year,make,model,trim,vin,price,mileage,exteriorColor,sellerName,sellerType,description
https://example.com/listing,2015 Honda Odyssey EX-L,2015,Honda,Odyssey,EX-L,5FNRL5H6XFB000000,10174,142000,Silver,Example Dealer,dealer,No accidents
```

Required columns:

- `url`
- `title`

High-value optional columns:

- `vin`
- `price`
- `mileage`
- `year`
- `make`
- `model`
- `trim`
- `exteriorColor`
- `sellerName`
- `sellerType`
- `description`

## AutoTrader

AutoTrader does not expose a simple export button for normal search results. Practical options:

- Save a search on AutoTrader and use email alerts as the source of truth. When an alert includes a promising listing, paste it into Manual import or add a row to Bulk import.
- Use browser-assisted extraction from a visible search-results page into CSV. Capture only fields visible to a normal user: listing URL, title, year, make, model, trim, price, mileage, seller, and visible badges such as accident/title notes.
- For one-off candidates, open the listing and use Manual import. This is slower but gives better notes and avoids importing noisy broad results.

## CarGurus

CarGurus supports saved searches and visible result pages, and our app already has a seeded dealer-profile adapter for two dealer pages. For broader model searches:

- Save searches on CarGurus for each target model around Cypress and import promising alert results manually.
- Use browser-assisted extraction from a visible result page into the same CSV columns when a search page has many relevant candidates.
- Prefer VIN-backed rows when visible, because VIN dedupe is much stronger than title/URL matching.

## Recommended Near-Term Workflow

1. Run the scheduled/active source refresh first.
2. Check ranked candidates.
3. If fewer than 25 candidates are useful, open AutoTrader and CarGurus saved searches in the browser.
4. Export/copy only promising listings into the Bulk import CSV format.
5. Preview the import, then save it with the admin token.

This keeps direct collection conservative while still letting the app rank listings found through high-coverage marketplaces.
