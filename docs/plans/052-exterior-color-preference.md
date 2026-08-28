# Plan 052 — Exterior Color Preference

## Goal

Support exterior color preferences for heat-sensitive searches without hiding good listings when sources omit color.

## Scope

- Store optional `exteriorColor` on normalized listings and snapshots.
- Parse visible Dealer Car Search exterior color values.
- Add soft `preferences.colorPreferences` scoring.
- Add optional hard-when-known `filters.excludedExteriorColors`.
- Show exterior color in listing detail when available.

## Result

Known preferred exterior colors receive a small deal-score boost, known avoided colors receive a small penalty, and `excludedExteriorColors` can remove known matching colors while leaving unknown-color listings eligible.
