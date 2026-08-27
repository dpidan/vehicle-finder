# 039 - Maintenance Item Estimates

## Goal

Capture obvious immediate-maintenance items from listing text and include their estimated cost in the reserve-aware effective purchase cost.

## Scope

- Parse explicit listing phrases for common immediate needs such as tires, brakes, battery, windshield, timing belt, and check-engine diagnostics.
- Add matched items to ranked results with label, estimated cost, and the text phrase that triggered the estimate.
- Include known explicit item costs in effective purchase cost in addition to the saved-search maintenance reserve.
- Flag listings whose explicit maintenance items exceed the saved-search maintenance reserve.
- Surface items in the dashboard detail panel.

## Non-goals

- Do not infer maintenance needs from mileage alone.
- Do not build a full repair catalog.
- Do not replace pre-purchase inspection or mechanic estimates.

## Result

Implemented a small evidence-based parser for explicit listing text. This keeps estimates conservative: no item appears unless the listing text says it is needed, due, bad, cracked, or illuminated.
