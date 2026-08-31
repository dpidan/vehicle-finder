# Plan 056 — Usable Source Coverage

## Goal

Get the dashboard to a usable family-search state by increasing real candidate coverage before adding more dashboard polish.

## Scope

- Promote already-built healthy feeds before writing new adapters.
- Keep blocked/challenge-page sources out of scheduled refresh.
- Make manual/browser-assisted imports from large aggregators a supported operator workflow.
- Use saved-search filtering after import so broad source inventories can serve multiple future searches without polluting rankings.

## Source Activation

Promote these feeds to `active`:

- Toyo Financial Group on CarGurus: recent standalone run returned VIN-backed listings with price, mileage, exterior color, seller, and listing URL.
- VSA Motorcars on CarGurus: same adapter run returned VIN-backed listings with useful ranking fields.
- Auto Land of Texas on MyNextRide: recent standalone run returned 61 listings and includes family-relevant candidates such as Honda Odyssey, Honda CR-V, Ford Edge, and Ford Explorer. Price is often missing, so this is useful coverage but weaker scoring evidence.
- Uptown Imports GotGoodCars: recent standalone run returned 70 listings with price, mileage, exterior color, and detail URLs.
- CROWN AUTO GotGoodCars: previously validated under-$20k feed; include it in the GotGoodCars smoke-test seed list so local checks match the registry.

Keep these paused/blocked:

- Dealer.com Autostrade: Node can collect it, but Worker fetch returned HTTP 403.
- Ride Motors iSeeCars: still fetches, but the latest smoke run returned 13 off-target listings for the current family search.
- Ride Motors generic JSON-LD: overlaps the iSeeCars-specific feed.
- Dealer sitemap / Carsforsale blocked feeds: keep out of scheduled refresh until access behavior changes.

## Import Ergonomics

Use the existing dashboard Bulk import panel for aggregator or browser-assisted data. It accepts JSON or CSV with these useful columns:

```csv
url,title,year,make,model,trim,vin,price,mileage,exteriorColor,sellerName,sellerType,description
```

Only `url` and `title` are required, but `vin`, `price`, and `mileage` make the ranking far more useful.

## Usable Enough Bar

The near-term target is 25-50 live matching candidates across at least 4 active source paths, with most ranked candidates having a detail URL, price, mileage, and seller. If active feeds do not produce enough matching candidates after this promotion, the next chunk should improve browser-assisted imports from AutoTrader and CarGurus rather than adding another scraper.
