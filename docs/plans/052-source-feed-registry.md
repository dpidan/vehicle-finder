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
