# 043 - Recall Detail Display

## Goal

Show cached recall lookup results in listing detail.

## Scope

- Read cached recall lookup data for a listing's year, make, and model.
- Include cached recalls in the listing detail API response.
- Display up to five recall notes in the dashboard detail panel.
- Add recall verification to the inspection checklist when cached recalls exist.

## Non-goals

- Do not call NHTSA from public listing detail requests.
- Do not score recall count or severity yet.
- Do not claim a recall is open for the exact VIN.

## Result

Listing detail now surfaces cached recall context as a verification prompt. Buyers can see recall campaign notes after an admin recall lookup has populated the cache.
