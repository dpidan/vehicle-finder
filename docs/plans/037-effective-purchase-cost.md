# 037 - Effective Purchase Cost

## Goal

Make Deal Score account for the saved search's immediate-maintenance reserve, not just the listed asking price.

## Scope

- Compute effective purchase cost as asking price plus `workflow.immediateMaintenanceBudget`.
- Add a small Deal Score factor when the reserve-aware total is comfortably inside target budgets or above the absolute max.
- Flag candidates whose reserve-aware total exceeds the absolute maximum.
- Surface the estimate in the dashboard detail panel.

## Non-goals

- Do not infer specific repairs from listing text yet.
- Do not estimate taxes, registration, insurance, financing, or travel costs yet.
- Do not add a repair-cost catalog until we have enough real listings to justify it.

## Result

Implemented as a conservative reserve-aware estimate. It keeps the buyer from treating a listing at the top of budget as affordable when the planned immediate-maintenance reserve would push the real near-term outlay over the line.
