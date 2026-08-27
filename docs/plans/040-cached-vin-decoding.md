# 040 - Cached VIN Decoding

## Goal

Add a small cached VIN-decoding primitive using the official NHTSA vPIC API.

## Scope

- Add a `vin_decodes` cache table keyed by normalized VIN.
- Decode one VIN on demand through an admin-protected route.
- Store selected flat fields plus the raw response JSON.
- Return cached data when present.

## Non-goals

- Do not decode every vehicle automatically yet.
- Do not overwrite canonical vehicle fields from decode data yet.
- Do not add recall lookup yet.

## Notes

NHTSA vPIC documents `DecodeVinValues` and recommends sending model year when available. The first implementation uses that flat endpoint because the response is easy to persist and inspect.
