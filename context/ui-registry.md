# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Button

`components/ui/button.tsx`

CVA-based, two variants (`primary` default / `secondary`), two sizes (`default` / `sm`). Renders a native `<button>`; for link-styled CTAs, apply `buttonVariants({...})` directly to a `next/link` `className`.

Base classes: `inline-flex items-center justify-center rounded-none border-2 md:border-4 border-black font-black uppercase transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`

- `primary`: `bg-[#ff006e] text-white`
- `secondary`: `bg-black text-white`
- `default` size: `px-6 py-3 text-sm md:px-8 md:py-4 md:text-lg`
- `sm` size: `px-4 py-2 text-xs md:text-sm`

### Navbar

`components/navbar.tsx`

Global, rendered once in `app/layout.tsx`. Logo left, nav links (Dashboard, History, Profile) + Upload Document CTA (`Button` `sm`) right. No sidebar.

Classes: `bg-white border-b-2 md:border-b-4 border-black px-4 md:px-8 lg:px-12`, inner row `flex items-center justify-between max-w-6xl mx-auto gap-4 md:gap-6 py-4 md:py-6`, links `font-mono text-xs md:text-sm uppercase tracking-wider hover:underline`.

Upload Document CTA is wrapped in Clerk's `<Show when="signed-in">` / `<Show when="signed-out">` (not `<SignedIn>`/`<SignedOut>`, removed in Clerk Core 3) — routes to `/dashboard` when authenticated, `/login` otherwise. Same pattern used for the homepage hero CTA in `app/page.tsx`.

### Footer

`components/footer.tsx`

Used on the homepage only (per build plan — not global). Logo + tagline column, Product links column.

Classes: `bg-black text-white py-12 md:py-24 px-4 md:px-8 lg:px-12`, grid `grid-cols-1 md:grid-cols-3 gap-6 md:gap-8`.

### Input

`components/ui/input.tsx`

Single styled `<input>`, forwardRef, no variants.

Classes: `w-full rounded-none border-2 md:border-4 border-black font-mono text-sm md:text-base px-3 py-2 md:px-4 md:py-3 bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:pointer-events-none disabled:opacity-50`

### Login Page

`app/login/page.tsx`

Custom Clerk flow (not the prebuilt `<SignIn>`/`<SignUp>` components) built on `useSignIn`/`useSignUp`'s Future API, so every error message can be mapped to the exact strings required by `authentiation-security.md` §4 — a login failure never reveals whether the email has an account. Tabs (`Log In` / `Sign Up`) toggle between modes; sign-up moves to a third `verify` mode (6-digit email code, with a resend link) before creating the session.

Tabs: `flex-1 rounded-none border-2 md:border-4 border-black font-black uppercase text-xs md:text-sm px-4 py-2 md:py-3 transition-all duration-200`, active tab adds `bg-[#ff006e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`. Card wrapper matches the standard card pattern below. Error banner: `rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3`.

Error-message mapping lives in `lib/auth/errors.ts` (`AUTH_ERRORS` + `mapSignInError`/`mapSignUpError`/`mapVerificationError`), reused by any future auth-adjacent UI.

### Dropzone

`components/upload/dropzone.tsx`

Click-or-drag file target. Whole area is a `role="button"` (keyboard-activatable), hides a native `<input type="file">` that it proxies clicks to. Drag-over gives an instant `bg-[#ccff00]` snap (no transition on the color itself, matches the Brutal Snap rule), calls `onFileSelected(file)` on drop or picker change — validation lives in the caller (`lib/validation/file.ts`), not in this component.

Classes: `rounded-none border-2 md:border-4 border-black p-8 md:p-16 text-center transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2`, `bg-white` default / `bg-[#ccff00]` while dragging over.

### File Preview Row

`components/upload/file-preview.tsx`

Selected-file row: name (truncated), type + formatted size, Remove button. Matches the standard card pattern below.

Remove button: `rounded-none border-2 border-black bg-white font-black uppercase text-xs px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200`.

### Processing Steps

`components/upload/processing-steps.tsx`

Numbered step list (`Uploading → Reading document → Analyzing → Building your action plan`) driven by a `currentStep` index. Done steps get a `bg-[#ccff00]` checkmark badge, the active step gets `bg-[#ff006e] text-white`, pending steps stay `bg-white text-black/60` — same card wrapper as the rest of the page.

### Upload Page

`app/upload/page.tsx` (server) → `components/upload/upload-flow.tsx` (client, `UploadFlow`)

`app/upload/page.tsx` is a server component that resolves the internal user via `getCurrentUser()` and passes `userId` down — needed client-side for the typed PostHog events (`trackClientEvent`), which require `userId` as an explicit property even though `posthog.identify()` already scopes capture calls.

State machine (`idle | processing | failed`) over `Dropzone` → `FilePreview` → `ProcessingSteps`, reusing the login page's error-banner pattern (`bg-[#ff006e] text-white` bar) for both the invalid-file and upload-failed messages, worded exactly per `authentiation-security.md` §4. There is a single `error` state driving that one banner — don't add a second hardcoded banner on the `failed` status branch, it duplicates the message. `Try Again` on the failed state uses the `secondary` (black) Button variant so it doesn't blend into the pink error banner above it, and resets `status` to `idle` while keeping `file`/`idempotencyKey`, so retrying re-submits the same idempotency key rather than starting a new upload attempt.

Real upload logic (Feature 07): on Upload, a per-file-selection `crypto.randomUUID()` idempotency key is generated in `handleFileSelected` and sent with the file to `POST /api/documents`. File-type/size constants live in `lib/validation/file.ts`, shared with the server-side validation in `app/api/documents/route.ts`.

Real processing status (Feature 09): once the upload POST succeeds, `upload-flow.tsx` polls `GET /api/documents/[id]` every 2s (a `useEffect` on `[status, documentId]`, cleaned up on unmount/status change — no more `runMockProgression`). The "Uploading" step reflects the real request; the remaining steps stay at "Reading document" since `processingStatus` doesn't expose finer-grained stage info. On `processingStatus: "ready"` with a `caseId`, redirects to `/cases/[caseId]` — this won't actually happen until Feature 10 (AI analysis) exists to create the case, so right now a real upload correctly polls forever in dev; that's expected, not a bug. On `"failed"`, shows the exact processing-failure message from `authentiation-security.md` §4 and the button becomes "Retry" (calls `POST /api/documents/[id]` to restart the job) instead of "Try Again" (which resets to `idle` and is only used when the original upload request itself failed, i.e. no `documentId` was ever assigned) — `documentId` being set is what distinguishes the two.

### Card

`components/ui/card.tsx`

Extracted (per this file's own note) once the case page became the third page to reuse the pattern. Plain `<div>`, no variants: `rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-6`, `className` merges via `cn`. Homepage's "How It Works" and "More Than A Summary" cards (`app/page.tsx`) now use it too. The value-prop label chip stays ad hoc (`inline-block font-mono text-xs uppercase tracking-wider border-2 border-black px-2 py-1` + inline `backgroundColor` — Tailwind can't purge dynamic `bg-[var]` classes).

### Case Page

`app/cases/[id]/page.tsx` (server) → `components/cases/case-view.tsx` (client, `CaseView`) for the `ready` state; `components/cases/processing-state.tsx` / `failed-state.tsx` for the other two.

Real data (Feature 11) — `app/cases/[id]/get-case-detail.ts` replaces the Feature 08 mock (`mock-case.ts`, deleted) and exports the same `CaseDetail` type plus `getCaseDetail(id, userId)`, so `CaseView` and its children kept their Feature 08 prop shapes; only `page.tsx` and the data layer changed. `getCaseDetail` returns a `CaseDetailResult` discriminated union (`processing` / `failed` + `processingError` / `ready` + `caseDetail`) instead of putting `processingStatus` on `CaseDetail` itself, since `CaseView` only ever renders for `ready`. `/cases/[id]` accepts either a caseId (the common path once analysis is ready) or the source documentId (reachable before a case exists — e.g. a future dashboard link to a still-processing/failed document): `getCaseDetail` probes `assertCaseOwner` first, falls back to `assertDocumentOwner`, and a ready document resolves to its case either way. Ownership errors (`AUTH_ERRORS.forbidden`/`notFound`) are caught in `page.tsx` and rendered inline with the standard pink error-banner pattern — there's no shared not-found/error boundary yet. Deadline rows only store a numeric `confidence` (no `evidenceState` column — see architecture-context.md), so `get-case-detail.ts` derives the `EvidenceTag` shown on `DeadlineSection` from a flat threshold (`confidenceToEvidenceState`, ≥0.7 → explicit else inferred).

New: **`report-error-button.tsx`** (`ReportErrorButton`) — "Report an error" link under an extracted fact; fires `correction_reported` (`{userId, caseId, errorType}`) on click and swaps to a "Reported" label, no backend record. Takes `tone` (`"dark"` default / `"light"` for the solid-black deadline-passed card). `FactSection` and `DeadlineSection` both take an optional `report={{userId, caseId, errorType}}` prop that renders it; `CaseView` supplies one for What This Is/Why You Received It/Deadline/If You Do Nothing (`errorType` = the extraction field name, or `"deadline"`). `CaseView` also now takes a `userId` prop (for this and for `deadline_viewed`, fired once per case view) and reads `caseDetail.originalDocumentUrl` (a real `getShortLivedFileUrl` — see `lib/storage/index.ts` — signed URL, opened in a new tab) instead of the old `href="#"`. `FailedState` takes an optional `message` prop (the real `document.processingError`) and falls back to its original hardcoded string when omitted.

Checklist toggling (`CaseView`'s `tasks`/`materials` state) and the Notes section's add-note are still real local interactions that don't persist (reset on refresh) — Feature 12 wires the real `PATCH /api/tasks/[id]` and `caseNotes` persistence; required materials have no persisted completion state at all (schema has none), so that checklist stays local-only even after 12. "Draft a Response," "Mark Case Complete," and the Failed state's "Retry" are intentionally inert buttons (no `onClick`) — their real behavior is explicitly owned by later features (14, 12, 09) that also add more UI around them. The AI Help panel is deliberately the empty state only (heading, description, disabled example-question chips, disabled input/Ask) — Feature 13 adds the real message list and wires it up.

New components, all under `components/cases/` unless noted:
- **`status-badge.tsx`** (`StatusBadge`) — `ActionStatus` → colored pill. `required` = pink/white, `recommended` = yellow/black, `not_required` = green/black, `unknown` = white/black, `deadline_passed` = black/white.
- **`evidence-tag.tsx`** (`EvidenceTag`, `SourcePageTag`) — `EvidenceTag` renders nothing for `explicit` (the default/trusted case) and a small colored tag for `inferred` (blue)/`unknown` (yellow)/`not_found` (black) — this is the "visual difference between explicit, inferred, and unknown" the spec asks for. `SourcePageTag` renders a plain white "Page N" tag. Both: `inline-block font-mono text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-1.5 py-0.5`.
- **`case-header.tsx`** (`CaseHeader`) — Back to Dashboard link, document type/issuer/issue date, case status pill (Active/Completed).
- **`fact-section.tsx`** (`FactSection`, exports `EvidenceValue` type) — shared shape for What This Is / Why You Received It / If You Do Nothing: heading + `EvidenceTag`/`SourcePageTag` + body, falls back to "Not stated" when the value is missing or `not_found`.
- **`deadline-section.tsx`** (`DeadlineSection`, exports `DeadlineView`) — prominent large-type date; "Not stated" when missing; card flips to solid black/white when `actionStatus === "deadline_passed"`.
- **`submission-section.tsx`** (`SubmissionSection`, exports `SubmissionMethodView`) — one or more method/destination/instructions blocks, divided by `border-t-2 border-black/10`.
- **`uncertainties-section.tsx`** (`UncertaintiesSection`) — bulleted list, renders nothing when empty.
- **`ai-help-panel.tsx`** (`AiHelpPanel`) — see empty-state note above.
- **`notes-section.tsx`** (`NotesSection`, exports `NoteView`) — local-only add-note list, textarea + Save.
- **`processing-state.tsx`** / **`failed-state.tsx`** — reuse `components/upload/processing-steps.tsx`'s `ProcessingSteps` (frozen at a fixed step for now) and the login/upload pages' pink error-banner pattern respectively, for visual consistency with the rest of the app.
- **`case-view.tsx`** (`CaseView`) — orchestrator; owns `tasks`/`materials` checklist state and lays out every section in the order from `project-overview.md`'s Action Plan example.
- **`components/tasks/checklist.tsx`** (`Checklist`, exports `ChecklistItem`) — shared by "What To Do" (tasks, `numbered`) and "What You Need" (materials, unnumbered); splits items into Required/Optional groups, native `<input type="checkbox">` styled to the design system.
