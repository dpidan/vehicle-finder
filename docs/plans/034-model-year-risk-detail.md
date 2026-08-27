# Plan 034 - Model-Year Risk Detail

## Objective

Surface structured model-year risk knowledge on listing detail pages.

## Scope

- Seed a few initial model/year risk records from the existing knowledge matrix.
- Add a service read for risks matching a listing vehicle's make, model, and year.
- Include matching risks in `/api/listings/:id`.
- Render conservative risk and inspection guidance in the dashboard detail panel.

## Deferred

- Risk impact on Vehicle Score.
- Evidence-record joins and source links.
- Trim, engine, and transmission matching beyond stored fields.
