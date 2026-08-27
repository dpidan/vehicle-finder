# 038 - Suspicious Price Flags

## Goal

Add the first "why is this cheap?" signal without pretending to know market comparables yet.

## Scope

- Flag a listing as `suspiciously-low-price` when its price is far below the saved search cash target and the listing is missing basic transparency signals.
- Use the flag as an inspection/workflow prompt, not as a direct score penalty.
- Document the threshold as a temporary heuristic until comparable-listing data exists.

## Non-goals

- Do not build market-comparable pricing yet.
- Do not infer seller intent.
- Do not reject low-priced listings automatically.

## Result

Implemented a conservative first-pass flag: price at or below 60% of the saved search cash target, plus missing VIN, missing title status, or missing maintenance evidence. This makes very cheap listings easier to scrutinize while still allowing genuinely good bargains to rank well.
