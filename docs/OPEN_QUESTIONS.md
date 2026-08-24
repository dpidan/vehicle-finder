# Open Questions and Deferred Items

This file captures important product questions that should not block the initial build.

## Public product

- Who is the primary public audience: local buyers, enthusiasts, families, budget shoppers, or anyone shopping used vehicles?
- What account model is needed for public users, teams, or households?
- What abuse prevention, rate limits, and source-protection behavior are required if public usage grows?
- What public-facing disclaimers and conservative language are needed around risk flags, seller confidence, and recommendation wording?

## Monetization

- Should the product be free, paid, freemium, or bundled with paid vehicle-history/enrichment features?
- Which features, if any, create enough value to charge for: alerts, saved searches, paid history integrations, advanced scoring, inspection workflow, or assistant access?
- What usage limits are appropriate for free users if source access or enrichment has real cost?

## Data and enrichment

- Which paid data sources are legally and economically useful enough to integrate?
- Can paid vehicle-history providers be optional per user/search without changing the core schema?
- What evidence standards are required before a risk rule affects public scoring?
- Which generic attributes should become first-class columns because they are queried frequently?

## Source access

- What compliant access options exist for Facebook Marketplace, Nextdoor, Autotrader, Cars.com, CarGurus, and dealer platforms?
- Which sources can support alerts or notification import instead of direct collection?
- How should manual imports handle screenshots, copied listing text, missing VINs, and source attribution?

## Product direction

- Should Dashboard remain the primary experience, followed by automated alerts, then MCP/assistant access?
- How configurable should optimization goals be for nontechnical users?
- Should the product expose predefined profiles such as best deal, lowest risk, fastest purchase, and lowest long-term ownership cost?
- How much manual workflow should the app include before it becomes too heavy for casual users?
