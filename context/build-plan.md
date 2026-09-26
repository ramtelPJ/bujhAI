# Build Plan — bujhAI

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Rules for Coding Agents

Read these before every feature:

- `project-overview.md` — what the product does, pages, flows, AI contract, events
- `architecture-context.md` — stack, folder boundaries, schema, processing model, invariants
- `authentication-security.md` — auth, ownership, error messages, edge cases, launch checklist
- `frontend-design.md` — Neo-Brutalist design system (tokens, required classes, forbidden classes)
- `ui-registry.md` — existing components; match them before building new ones, and add every new component after building it

Always:

- Build **one feature at a time**, in order. Do not start the next feature until the current one is visible and testable.
- **Do not add features** that are not in `project-overview.md`. If something seems missing, stop and ask.
- Follow the folder boundaries in `architecture-context.md` (`app/`, `components/`, `lib/`, `trigger/`, `prisma/`).
- Every server read and mutation checks ownership: `User → Document → Case → Case Data`. Never trust a client-provided `userId`.
- Validate all API input and all AI output with Zod before it reaches the database or UI.
- No long-running OCR or AI work inside request handlers — use Trigger.dev.
- Never invent a deadline, requirement, contact method, or consequence. Keep explicit / inferred / unknown / not found distinguishable in data and UI.
- Never send raw document contents, OCR text, or sensitive extracted text to PostHog or error logs.
- Drafts are editable text only. Nothing is ever sent or submitted by bujhAI.
- Use the exact user-facing error messages from `authentication-security.md` §4.
- Keep AI model names and prompts centralized in `lib/ai/`.

### Source-of-truth notes

Where the context files differ, use this:

| Topic | Use |
|---|---|
| AI conversation tables | `conversations` + `messages` (architecture). `interactions` in the security doc refers to the same data. |
| Ownership enforcement | Server-side ownership checks on every query (architecture) **and** Postgres RLS on every user-owned table (security doc). |
| Auth method | Clerk with email sign-up/login and required email verification. |
| Extracted facts | `extractions` table (architecture). |

---

## Phase 1 — Foundation

### 01 Project Setup + App Shell

Set up the project and the shared layout every page uses.

**UI:**

- Top navbar — bujhAI logo, Dashboard, Upload Document, History, Profile
- Upload Document styled as the primary CTA
- No sidebar
- Base page container and typography following `frontend-design.md`

**Logic:**

- Next.js + TypeScript app with the folder structure from `architecture-context.md`
- Tailwind CSS + shadcn/ui installed; shadcn components restyled to Neo-Brutalist tokens (`rounded-none`, black borders, hard shadows). Refer to frontend-design.md for UI. 
- Zod installed; `lib/validation/` created
- `.env.example` with all variables from `architecture-context.md`
- Add navbar to `ui-registry.md`

---

### 02 Homepage

Build the complete homepage UI.

**UI:**

- Navbar (from 01)
- Hero — headline and subheadline explaining the core promise: understand paperwork and get the next step done; primary CTA: Upload Document
- How it works section — upload → understand → get it done
- Core value proposition section — not just a summary: what it is, whether action is required, deadline, what to do, what you need, where to send it
- Footer

**Logic:**

- Upload Document CTA → `/dashboard` if authenticated, `/login` if not

---

### 03 Auth

Clerk authentication with email.

**UI:**

- `/login` page — email sign-up and login, email verification step

**Logic:**

- Clerk email sign-up/login with required email verification
- Secure HTTP-only session cookies (Clerk default); no tokens in client-accessible storage
- Middleware protecting `/dashboard`, `/upload`, `/cases/[id]`, `/history`, `/profile`, and all `app/api/*` routes
- After login → redirect to `/dashboard`
- Rate-limit login and verification attempts
- Error messages exactly as in `authentication-security.md` §4 — never reveal whether an email has an account
- On first authenticated request, create a `users` row linked by `clerkId` (`lib/auth/`)
- `lib/auth/getCurrentUser()` helper returns the internal user or rejects with "Please log in to continue."

---

### 04 PostHog Initialization

Set up PostHog before any events fire.

**Logic:**

- `lib/analytics/posthog-client.ts` — browser client using `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
- `lib/analytics/posthog-server.ts` — server client with `flushAt: 1` and `flushInterval: 0`
- Initialize PostHog in root layout
- `posthog.identify()` after login with internal user ID
- `posthog.reset()` on logout
- `lib/analytics/events.ts` — typed helpers for every event in `project-overview.md`; properties limited to the ones listed there (no document text)

---

### 05 Database Schema + Ownership Layer

All Prisma models created before any data is written.

**Logic:**

- `prisma/schema.prisma` with every table from `architecture-context.md`:
  - `users`, `documents`, `cases`, `extractions`, `deadlines`, `tasks`, `requiredMaterials`, `submissionMethods`, `conversations`, `messages`, `drafts`, `caseNotes`
- Enums: `processingStatus`, `actionStatus` (`required`, `recommended`, `not_required`, `unknown`, `deadline_passed`), `urgency` (`critical`, `high`, `medium`, `low`, `unknown`), case `status`, task `status`, message `role`, draft `type`
- Evidence state stored with extracted facts: `explicit`, `inferred`, `unknown`, `not_found`
- Relations and cascades matching the Core Relationships diagram
- Run Prisma migration
- Postgres RLS enabled on every user-owned table, default deny:
  - Direct ownership: `documents`, `cases`, `conversations`, `drafts`, `caseNotes` → `userId = current user`
  - Child records: `extractions`, `deadlines`, `tasks`, `requiredMaterials`, `submissionMethods` → parent `cases.userId = current user`; `messages` → parent conversation's case owner
- `lib/db/` — Prisma client and a helper that runs queries with the current user set for RLS
- `lib/auth/ownership.ts` — `assertDocumentOwner`, `assertCaseOwner` helpers used by every route
- Ownership fields (`userId`, `caseId`, `documentId`) are always set server-side and never updatable from the client
- Vercel Blob configured for private access in `lib/storage/`

---

## Phase 2 — Upload

### 06 Upload Page — Full UI

Build the complete upload page UI with mock states. No upload logic yet.

**UI:**

- Page heading and short explanation
- Drag and drop upload area — PDF or image, click to select
- Supported file types and size limit note
- Selected file preview row — file name, type, size, remove button
- Upload button
- Processing state — steps shown: Uploading → Reading document → Analyzing → Building your action plan
- Error states — invalid file, upload failed (exact messages from security doc)
- Add all new components to `ui-registry.md`

---

### 07 Document Upload + Storage

Wire the upload page to Vercel Blob and the `documents` table.

**Logic:**

- `POST /api/documents`
- Server-side validation of file type (PDF, image) and size — reject with "This file can't be uploaded. Check the file type and size."
- Upload file to private Vercel Blob; store only `blobPath` in DB
- Create `documents` record — `userId` from session, `fileName`, `mimeType`, `fileSize`, `processingStatus: uploaded`
- Idempotency key per upload attempt so refresh/retry does not create duplicate documents
- If the Blob upload or DB write fails, clean up the partial upload and show "Upload failed. Please try again."
- Never return a permanent public Blob URL

**PostHog events:** `document_upload_started`, `document_uploaded`

---

## Phase 3 — Processing + Case Page

### 08 Case Page — Full UI

Build the complete `/cases/[id]` page UI with mock data, following the Action Plan layout in `project-overview.md`. The actionable result comes first.

**UI:**

- Back to Dashboard link
- Case header — document type, issuer, issue date, case status
- **What this is** — plain-language explanation
- **Why you received it**
- **Your status** — badge: Required / Recommended / No action / Unknown / Deadline passed
- **Deadline** — shown prominently; uncertain deadline shown as uncertain, missing deadline shown as "Not stated"
- **What to do** — numbered task checklist, required and optional clearly separated
- **What you need** — required materials checklist, required vs optional separated
- **Where to send it** — submission method and destination
- **If you do nothing** — document-supported consequence or "Not stated"
- **Next step** — Draft a response button
- Source page reference next to important facts ("Page 2")
- Visual difference between explicit, inferred, and unknown information
- Uncertainties section
- Original document link
- AI Help panel — empty state with example questions
- Notes section
- Mark case complete button
- Processing state (document still being analyzed)
- Failed state — "We couldn't finish analyzing this document." with Retry button
- Add all new components to `ui-registry.md`

---

### 09 Document Processing Pipeline

Trigger.dev job that turns an uploaded file into normalized page text.

**Logic:**

- After a successful upload (07), set `processingStatus: processing` and start the Trigger.dev job in `trigger/documents/`
- Redirect the user to the processing state
- Pipeline steps:
  - File validation
  - PDF/image parsing, multi-page support, set `pageCount`
  - OCR when a page has no usable text (`lib/ocr/`)
  - Page/text normalization, keeping page numbers for source references
- Retries for transient failures
- On failure: set `processingStatus: failed`, store a user-safe error message, preserve the original upload, create no analysis
- If the document is deleted while processing, stop and discard results
- Processing state UI polls the document status and redirects to `/cases/[id]` when ready
- Retry button on failed state restarts the job
- Error logs contain only the fields listed in security doc §4 — no document text

---

### 10 AI Document Analysis + Extraction

OpenAI analysis that produces the `DocumentAnalysis` result and creates the case.

**Logic:**

- Runs in Trigger.dev (`trigger/analysis/`) after 09 succeeds
- `lib/ai/` — prompts, model config, and a Zod schema matching the `DocumentAnalysis` contract in `project-overview.md`
- Input: normalized page text with page numbers
- AI rules in the prompt:
  - Ground every important claim in the document
  - Never fabricate deadlines, requirements, contacts, or consequences
  - Mark each fact explicit, inferred, unknown, or not found
  - Include source page (and supporting text where appropriate) and confidence
  - List uncertainties
- Validate output with Zod; on invalid or incomplete output, retry, then mark failed with "We couldn't analyze this document right now." — never save a misleading partial result
- Persist in one transaction:
  - `cases` — document type, issuer, recipient, issue date, action status, urgency, summary, primary deadline, status `active`
  - `extractions`, `deadlines`, `tasks`, `requiredMaterials`, `submissionMethods`
- Low-confidence deadlines saved as uncertain, never as confirmed
- Set `actionStatus: deadline_passed` when the identified deadline is already in the past
- Set `processingStatus` to ready

**PostHog events:** `document_analysis_started`, `document_analysis_completed`

---

### 11 Case Page — Real Data

Wire the case page UI (08) to real data.

**Logic:**

- Server-side load of case and all child records with ownership check
- Another user's case → "You don't have access to this item." Missing case → "We couldn't find that item."
- Render every action plan section from DB data
- Show explicit / inferred / unknown / not found states exactly as stored
- Source page references shown next to facts that have them
- Original document opened through a short-lived, server-authorized access URL — never a permanent public link
- Processing and failed states driven by `processingStatus`
- Report an error option on extracted facts — fires `correction_reported` with `errorType` only

**PostHog events:** `deadline_viewed`, `correction_reported`

---

## Phase 4 — Getting It Done

### 12 Checklist, Notes + Case Completion

**UI:**

- Task checkboxes and material checkboxes on the case page
- Notes — add and edit notes
- Mark case complete button with confirmation

**Logic:**

- `PATCH /api/tasks/[id]` — toggle status, set `completedAt`; ownership through task → case → user
- Notes create/update in `caseNotes`, owned by current user
- Mark case complete — set case `status: completed`; original document and history stay accessible
- Updates never modify the original analysis or document

**PostHog events:** `task_completed`, `case_completed`

---

### 13 AI Help — Grounded Q&A

**UI:**

- AI Help panel on the case page — message list, input, example question chips ("What is this?", "Do I need to do anything?", "When is this due?", "What do I need to send?", "Where do I send it?", "What happens if I do nothing?", "Explain page 3")
- Loading state while answering
- Suggested checklist items from the assistant shown with an Add to checklist button

**Logic:**

- `POST /api/conversations` — create or reuse the conversation for the case (ownership checked)
- Store user and assistant messages in `messages`
- AI receives the case's document page text and structured analysis; the document is the primary source
- Answers state uncertainty clearly, separate document facts from general guidance, and cite pages where possible
- No legal advice, medical diagnosis, or financial transactions
- Supported: explain the document, answer questions, explain confusing sections, explain checklist items, create a checklist
- Checklist items suggested by AI are added to `tasks` only when the user clicks Add

**PostHog event:** `assistant_question_asked`

---

### 14 Drafts + Call Questions

**UI:**

- Draft a response button opens draft options — Response / Email / Letter
- Optional instructions field
- Editable draft editor with Copy button and Save
- Clear note that bujhAI does not send drafts
- Prepare questions for a call action in AI Help

**Logic:**

- `POST /api/drafts` — generates grounded draft from case data + user instructions; validated before saving to `drafts`
- `PATCH /api/drafts/[id]` — save user edits
- No send, submit, or external action of any kind
- Call questions generated through AI Help (13) and stored as assistant messages

**PostHog event:** `draft_generated`

---

### 15 Document + Case Deletion

**UI:**

- Delete document button on the case page with confirmation dialog
- Success and failure feedback

**Logic:**

- `DELETE /api/documents/[id]` — ownership check, delete Blob file, delete document and its case with all child records
- Only report success if deletion actually completed; otherwise "We couldn't delete this document. Please try again."
- Cancel or ignore any running processing for the document
- Accessing a deleted case afterwards returns "We couldn't find that item."

**PostHog event:** `document_deleted`

---

## Phase 5 — Dashboard + History

### 16 Dashboard Page — Full UI

Build the complete dashboard UI with mock data.

**UI:**

- Attention summary — "3 actions need attention"
- Upcoming deadlines grouped — Today / This week / Later
- Active cases list — document type, issuer, status badge, deadline
- Recently analyzed documents
- Quick Upload Document CTA
- Empty state for new users with Upload Document CTA
- Add all new components to `ui-registry.md`

---

### 17 Dashboard — Real Data

**Logic:**

- All queries filtered by current user
- Actions needing attention — active cases with action status `required` or `deadline_passed`, and cases with pending required tasks
- Upcoming deadlines — active cases ordered by `primaryDeadline` ascending, grouped Today / This week / Later; uncertain deadlines labeled as uncertain
- Active cases — `status: active`
- Recently analyzed — latest documents with `processingStatus` ready, plus documents still processing or failed
- Each item links to `/cases/[id]`

---

### 18 History Page

**UI (mock first):**

- Completed cases list — document type, issuer, completed date
- Previous documents list
- Empty state

**Logic:**

- Completed cases for current user, newest first
- Previously uploaded documents for current user
- Each item opens `/cases/[id]` with original document and action history still accessible

---

## Phase 6 — Profile + Launch

### 19 Profile Page

**UI (mock first):**

- Account info from Clerk — name, email
- Preferences section
- Log out

**Logic:**

- Profile data managed through Clerk; only information needed for the product is collected (no onboarding questionnaire)
- Log out calls `posthog.reset()`

---

### 20 Security + Launch Hardening

Go through every item before launch. No new features.

**Logic:**

- Two-user test accounts: every CRUD operation on every table tested across users
- Test every edge case in `authentication-security.md` §5, including:
  - Changing IDs in URLs and requests, changing `userId`, changing ownership fields
  - Accessing another user's Blob file
  - Expired sessions, expired or reused verification links, repeated login attempts
  - Duplicate uploads, unsupported, oversized, corrupted, and malicious files
  - Deleting during processing, processing failing midway
  - Incomplete AI results, ambiguous or missing deadlines, invented information
  - Accessing deleted documents/cases
- Confirm no document text in PostHog events or error logs
- Confirm drafts are never treated as sent
- Complete every item in the Launch Security Checklist (`authentication-security.md` §6)
- Verify UI against the `frontend-design.md` self-check (no rounded corners, no blurred shadows, no gradients, no gray borders, focus states, reduced motion, WCAG AA contrast)
- Confirm all 11 PostHog events fire correctly

---

## Feature Count

| Phase | Features |
|---|---|
| Phase 1 — Foundation | 5 |
| Phase 2 — Upload | 2 |
| Phase 3 — Processing + Case Page | 4 |
| Phase 4 — Getting It Done | 4 |
| Phase 5 — Dashboard + History | 3 |
| Phase 6 — Profile + Launch | 2 |
| **Total** | **20** |

---

## Open Questions (confirm before the related feature)

These are not defined in the context files. Do not guess — ask.

- **07** — Maximum file size and exact allowed image types
- **19** — Which user preferences the Profile page stores
- **14** — Call questions are stored as AI Help messages because the `drafts` type enum only includes email/letter/response; confirm this is correct
