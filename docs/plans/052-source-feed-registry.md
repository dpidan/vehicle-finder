# Source Feed Registry

## Goal

Make source collection data-driven before adding more adapters.

## Current Chunk

- Add a durable `source_feeds` table that records which adapter should collect each inventory URL.
- Keep seller identity separate from feed identity so one seller can have multiple collection paths.
- Seed healthy Dealer Car Search feeds as active and keep CarGurus feeds paused for adapter/dedupe testing.
- Update saved-search refresh to collect active DB feeds, with a Dealer Car Search fallback for unmigrated local DBs.

## Longer-Term Uses

- Track source health through `last_collected_at`, `last_status`, and `last_error`.
- Pause or retire feeds without code changes.
- Run different adapters from the same scheduler by `adapter_key`.
- Support duplicate source paths for one seller, such as dealer-owned inventory plus aggregator profile.
- Add future official API, alert/import, or browser-assisted feeds without changing the listing model.

## Guardrails

- Do not run paused or blocked feeds in scheduled refresh.
- Do not add browser-assisted feeds to Cloudflare scheduled refresh.
- Prefer dealer-owned feeds for scheduled collection when both dealer-owned and aggregator feeds are available.
- Keep adapter-specific parsing logic in source adapters, not in the feed registry.

## Result

Source feeds are now the planned registry for collection inputs. Active feeds drive saved-search refresh; paused feeds remain available for manual adapter testing.

## Local Adapter Trial

Use `POST /api/admin/source-feeds/:id/collect` to collect one feed without changing its status. Send `{"import": true}` to import the collected candidates into local D1 after reviewing the VIN overlap summary.

On 2026-08-28, the two paused CarGurus feeds were tested against local D1 after two Dealer Car Search refreshes:

- Toyo Financial Group on CarGurus: 12 collected, 12 VINs, 0 existing VIN overlaps before import.
- VSA Motorcars on CarGurus: 23 collected, 23 VINs, 0 existing VIN overlaps before import.
- Combined CarGurus field quality after import: 35 listings, 35 VINs, 35 mileage values, 33 exterior colors.
- Rerunning both CarGurus imports updated 35 existing listings and inserted 0 duplicates.
- Saved-search evaluation still produced 5 qualifying listings, all from Dealer Car Search, so the CarGurus batch widened inventory but did not add current family-search matches under the hard filters.

Keep CarGurus as paused/on-demand for now. Promote only after source terms and stale-listing behavior are reviewed.
