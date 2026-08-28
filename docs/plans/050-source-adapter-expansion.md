# Plan 050 — Source Adapter Expansion

## Goal

Expand source coverage without changing the canonical import path.

## Current Chunk

- Upgrade existing Carsforsale parsing to prefer individual vehicle detail URLs when listing cards expose them.
- Keep inventory-page URLs only as a fallback.
- Preserve source attribution on the same URL the buyer should open.

## Next Candidate Chunks

1. Find one more healthy Dealer Car Search seed near the saved-search radius.
2. If no healthy Dealer Car Search seed is available, choose one additional structured dealer platform from existing research and add the smallest parser that can extract title, detail URL, price, mileage, VIN when visible, and seller.
3. Defer browser-assisted marketplace imports until the structured dealer path has at least two reliable live sources.

## Guardrails

- Use explicit seed URLs before automated dealer discovery.
- Do not add anti-bot bypass behavior.
- Keep collectors read-only and low-frequency.
- Treat detail-page photo/VIN crawling as a separate chunk.

## Result

The Carsforsale adapter now preserves vehicle detail links when the inventory HTML exposes them. This makes imported listings actionable from the dashboard and monitoring digest instead of sending the buyer back to a broad inventory page.
