# Frontend Guidelines

## Product Feel

Build the dashboard as a quiet, dense, work-focused tool. This is a buyer
workflow surface, not a marketing site. Prioritize scanning, comparison,
status updates, and quick action.

The first dashboard should make these jobs easy:

- choose a saved search;
- scan ranked listings;
- see why a listing scored well or poorly;
- inspect price, mileage, seller, title, risk, and history details;
- mark workflow state and next action.

## Route Shape

Use the route structure in `docs/plans/018-dashboard-route-structure.md`:

```text
/
  public marketing/info area

/app/*
  auth-protected React dashboard

/api/*
  auth-protected JSON API

/mcp
  auth-protected MCP endpoint
```

The React dashboard should call `/api/*` over HTTP. Do not import Worker
service modules directly into React components.

## Styling Decision

Start with plain CSS and CSS Modules:

- `src/react-app/styles/global.css` for reset, tokens, and app-level layout.
- `*.module.css` for component-local styles.
- CSS custom properties for design tokens.
- No Tailwind, Sass, CSS-in-JS, or generated styling system at first.

Vite supports CSS imports, PostCSS config, and CSS Modules natively, so this is
the lowest-dependency path.

Tailwind CSS v4 can be added later if utility classes become a net win. The
upgrade path from CSS Modules is reasonable because v4 is CSS-first and exposes
theme tokens as CSS variables. Keep early tokens in CSS custom properties so
they can map cleanly into a future Tailwind `@theme` block.

## Component Decision

Start with small local components for simple elements:

- button;
- text input;
- select;
- badge/status pill;
- score bar;
- listing row;
- detail panel;
- tabs or segmented control if needed.

Use semantic HTML and available modern web standards first. Add Base UI or other simple UI library only when a component needs hard accessibility behavior that is easy to get wrong, such as:

- dialog;
- popover;
- menu;
- combobox;
- tooltip;
- complex select;
- tabs with keyboard behavior.

Base UI is a good fit because it is unstyled and does not prescribe Tailwind,
CSS Modules, CSS-in-JS, or another styling layer. Explore others if they are more actively maintained or better supported, but avoid adopting a full styled component kit until the project has repeated UI patterns that justify it.

## Basic Design System

Use a small token set before designing many variants:

- color: page, surface, border, text, muted text, accent, success, warning,
  danger;
- spacing: 4, 8, 12, 16, 24, 32;
- radius: 4 and 8;
- type: body, compact label, section heading, page heading;
- shadow: one subtle elevation only when needed;
- layout: app shell, toolbar, list/detail split, responsive stacked view.
- light/dark mode: use CSS `prefers-color-scheme` to switch between two palettes.

Prefer neutral surfaces with restrained accents. Vehicle status and risk need
clear contrast, so do not let the palette collapse into one hue family.

Use cards only for repeated listing rows or genuinely framed panels. Do not
nest cards inside cards.

## Accessibility

- Use real buttons, links, labels, fieldsets, and headings.
- Preserve keyboard navigation for every control.
- Keep visible focus states.
- Do not use color alone to communicate status or risk.
- Keep touch targets comfortable on mobile.
- Use dialogs/popovers from Base UI or another headless accessible primitive
  when native HTML is not enough.

## Data And State

Start with React state plus `fetch`.

Do not add TanStack Query, Zustand, Redux, or router libraries until the
dashboard has enough repeated async state, caching, invalidation, or navigation
complexity to pay for them.

Local URL state is enough for early search/list/detail selection:

- selected search;
- filters;
- sort;
- selected listing.

## Short-Term Build Plan

1. Add the Cloudflare Hono + React/Vite structure without changing API/MCP
   behavior.
2. Add the `/app/*` dashboard shell.
3. Add global tokens and a few local CSS Module components.
4. Fetch saved searches and ranked listings from existing `/api/*` routes.
5. Add listing detail and workflow controls.

## Long-Term Considerations

- Add user authentication before exposing family data beyond a private
  deployment.
- Add a real client data cache only after repeated API calls become painful.
- Add Tailwind v4 only if utility classes would reduce CSS churn.
- Add Base UI as soon as complex interactive controls appear.
- Keep the design tokens portable so the styling layer can change without
  rewriting the product design.
- Revisit a larger framework only when routing, SSR, or app-shell complexity
  becomes real.

## References

- Cloudflare Hono guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- Hono Workers + Vite guide: https://hono.dev/docs/getting-started/cloudflare-workers-vite
- Vite CSS features: https://vite.dev/guide/features
- Tailwind CSS v4: https://tailwindcss.com/blog/tailwindcss-v4
- Base UI: https://base-ui.com/react/overview/about
