# Plan 019 - Frontend Guidelines

## Objective

Define the initial dashboard styling and component approach before adding the
React/Vite frontend.

## Decision

- Start with React + Vite on the existing Cloudflare Worker path.
- Use plain CSS, CSS custom properties, and CSS Modules first.
- Keep early components local and small.
- Add Base UI or other simple UI library for complex accessible primitives when needed.
- Do not start with Tailwind, but keep the token structure compatible with a
  later Tailwind CSS v4 adoption.

## Rationale

CSS Modules are built into Vite and avoid a styling dependency before the
dashboard has real repetition. Tailwind CSS v4 is less costly to adopt later
than earlier Tailwind versions because its configuration is CSS-first and its
theme values are CSS variables. Base UI stays compatible with either CSS
Modules or Tailwind because it is unstyled.

## Deferred

- Installing React/Vite dependencies.
- Installing Tailwind, Base UI, or other styling or component libraries.
- Choosing a client data-cache library.
- Choosing a client router.
