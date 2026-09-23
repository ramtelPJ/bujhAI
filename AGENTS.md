<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, storage model, and invariants
3. `context/frontend-design.md` — theme, colors, typography, canvas design, and component conventions. 
4. Update  `ui-registry.md` after every feature

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.

## Design Skill Usage

- `context/frontend-design.md` is the source of truth for the design system (theme, colors, typography, components). Never edit this file to fit a skill's output — edit the implementation instead.
- The `impeccable` skill may be used only for refining/polishing UI already built to `frontend-design.md` (spacing, hierarchy, micro-interactions, accessibility, etc.), never to redesign or replace the design system it defines.
- Do not invoke any other design/UI skill (e.g. `design-taste-frontend`, `gpt-taste`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `imagegen-*`, `stitch-design-taste`, `ui-ux-pro-max:*`, `apple-design`, `emil-design-eng`, `redesign-existing-projects`) even though installed — ask the user for explicit approval first.