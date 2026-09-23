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

`app/upload/page.tsx`

State machine (`idle | processing | failed`) over `Dropzone` → `FilePreview` → `ProcessingSteps`, reusing the login page's error-banner pattern (`bg-[#ff006e] text-white` bar) for both the invalid-file and upload-failed messages, worded exactly per `authentiation-security.md` §4. `Try Again` on the failed state uses the `secondary` (black) Button variant so it doesn't blend into the pink error banner above it.

No real upload/processing logic yet (Feature 07/09) — the processing steps are a timed mock, and the failed state is reached via a real `navigator.onLine` check (not a fake/unreachable branch) rather than a simulated random failure. File-type/size constants live in `lib/validation/file.ts`, shared with the server-side validation Feature 07 will add.

### Card (ad hoc pattern, not yet extracted into a component)

Used on the homepage for "How It Works" steps and "More Than A Summary" value-prop cards (`app/page.tsx`).

Classes: `rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-6`. Value-prop cards add a small label chip: `inline-block font-mono text-xs uppercase tracking-wider border-2 border-black px-2 py-1` with an inline `backgroundColor` style (accent hex varies per item — Tailwind can't purge dynamic `bg-[var]` classes, so this one stays inline style, not a utility class).

Extract into `components/ui/card.tsx` if a third page reuses this exact pattern.
