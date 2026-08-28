# Model / Year Knowledge — Initial Working Matrix

This is a starting research matrix, not a final reliability verdict. Before production scoring, each risk rule should carry evidence/source references and, where possible, affected VIN/trim/powertrain scope.

## Knowledge model

Risk data should support make, model, year range, optional trim/engine/transmission scope, issue category, severity, inspection guidance, and remediation evidence.

```ts
interface ModelYearRisk {
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  trim?: string[];
  engine?: string[];
  transmission?: string[];
  issue: string;
  category: 'engine' | 'transmission' | 'electrical' | 'body' | 'maintenance' | 'safety';
  severity: number;
  inspectFor: string[];
  remediation?: {
    description: string;
    resolvesRisk: boolean;
  };
  sourceRefs: string[];
}
```

## Honda Odyssey

| Years | Working rating | Investigation focus |
|---|---|---|
| 2005-2007 | Caution | Age, transmission/torque-converter history, steering, maintenance |
| 2008-2010 | Good | Age-related maintenance, paint/body, service history |
| 2011-2013 | Caution | VCM/misfire/piston-ring history, sliding doors/electrical, timing-belt history |
| 2014-2016 | Neutral/Good | Transmission behavior, misfires, maintenance evidence |
| 2017 | Good | Likely stretch-budget territory; verify market value and history |

Potential value pocket: a 2008-2010 Odyssey with unusually strong maintenance and condition, where age-related degradation has been addressed.

## Honda Pilot

| Years | Working rating | Investigation focus |
|---|---|---|
| 2009-2011 | Caution | VCM/oil-consumption/misfire history, timing belt |
| 2012-2013 | Caution | Piston-ring/misfire history, torque-converter behavior |
| 2014-2015 | Neutral/Good | V6 maintenance, oil consumption/misfire evidence |
| 2016 | Caution | First year of generation, transmission/electrical history, transmission variant |
| 2017 | Neutral | Transmission depends on trim/configuration; inspect accordingly |

The knowledge model must support trim/powertrain distinctions. A year-only verdict is too coarse.

## Toyota Sienna

| Years | Working rating | Investigation focus |
|---|---|---|
| 2007 | Caution | Age and relatively higher complaint history |
| 2008-2010 | Neutral/Good | Age-related maintenance, sliding doors |
| 2011 | Caution | First redesigned year, suspension/tire wear, doors |
| 2012-2014 | Good | Power sliding doors, general maintenance |
| 2015-2016 | Preferred | Sliding-door operation still requires inspection |
| 2017 | Good | Likely stretch-budget territory |

Sliding-door issues should be modeled as an inspectable/remediable subsystem risk rather than an automatic rejection.

## Toyota Highlander

| Years | Working rating | Investigation focus |
|---|---|---|
| 2008-2011 V6 | Caution | Verify 2GR-FE oil cooler pipe / VVT-i oil hose leak repairs and inspect for oil seepage |
| 2014-2015 | Neutral/Caution | Power back door operation; certain 2015 vehicles also need EPS recall VIN check |
| 2016-2017 | Good | Routine maintenance, suspension, tires, and service history |

Highlander should generally remain a strong family-search candidate, but older V6 examples need proof that known oil-hose/cooler-pipe issues were handled.

## Honda CR-V

Treat CR-V primarily as a different vehicle-role fit rather than a direct substitute for a minivan. Model/year research should be added if the family search begins surfacing enough CR-V candidates to justify deeper scoring rules.

## Ford Edge

| Years | Working rating | Investigation focus |
|---|---|---|
| 2015-2018 2.0L EcoBoost | Caution | Coolant loss, white smoke, rough start, misfire/overheat DTCs; engine replacement documentation if repaired |
| 2015-2018 | Caution | Brake hose recall completion and current brake-hose condition |
| 2019+ | Neutral | Verify powertrain and recall history; do not inherit older 2.0L coolant-intrusion rule without build/engine evidence |

Edge is useful as a lower-cost two-row SUV, but the 2015-2018 2.0L EcoBoost and brake-hose history deserve explicit inspection before purchase.

## Ford Explorer

| Years | Working rating | Investigation focus |
|---|---|---|
| 2011-2017 | Caution | Exhaust odor / carbon monoxide program completion, liftgate/body sealing repairs, collision/upfit history |
| 2013-2017 | Caution | Rear toe-link recall/program applicability, corrosion-region history, rear suspension movement/noise/alignment |
| 2011-2016 3.5L V6 | Caution | Coolant loss, oil contamination, timing-chain/water-pump service history |

Explorer can satisfy the three-row role, but model-year scoring should reward documented recall/program completion and strong mechanical inspection.

## Maintenance milestones

The knowledge base should eventually include scheduled/expected major maintenance by powertrain, such as timing-belt service where applicable. Missing documentation can then influence both risk score and estimated immediate maintenance cost.

## Evidence requirements

Before a rule affects production scoring:

1. Record one or more reputable sources.
2. Prefer manufacturer/NHTSA/service-bulletin/recall evidence where applicable.
3. Separate confirmed systemic issues from anecdotal complaint trends.
4. Record remediation and whether documentation should reduce the penalty.
5. Narrow year/trim/engine/transmission scope whenever evidence permits.
