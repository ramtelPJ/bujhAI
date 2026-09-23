# Architecture Context

## Stack

| Layer            | Technology               | Role                                                                                 |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Framework        | Next.js + TypeScript     | Full-stack application with server/client boundaries, routing, and API handlers      |
| UI               | Tailwind CSS + Neobrutalism UI | Consistent, accessible UI components and fast product development                    |
| Auth             | Clerk                    | User authentication, session management, and protected routes                        |
| Database         | PostgreSQL + Prisma      | Relational application data, ownership, cases, tasks, extractions, and conversations |
| File Storage     | Vercel Blob              | Private storage for uploaded documents and generated files                           |
| Background Tasks | Trigger.dev              | Durable document processing, OCR, AI analysis, validation, and retries               |
| AI               | OpenAI API               | Document understanding, structured extraction, grounded Q&A, and draft generation    |
| Analytics        | PostHog                  | Product analytics and processing/error events without sending document contents      |
| Validation       | Zod                      | Runtime validation of API inputs and AI-generated structured data                    |

### Why these choices

* **Next.js + TypeScript** — keeps the frontend and backend in one application while providing strong typing across the system.
* **Tailwind + neobrutalism/ui** — fits the document-heavy dashboard and makes reusable UI patterns easy to maintain.
* **Clerk** — removes the need to build authentication infrastructure while allowing server-side route and ownership checks.
* **PostgreSQL + Prisma** — bujhAI has strongly relational data: users own documents, documents create cases, cases contain tasks, materials, deadlines, and conversations.
* **Vercel Blob** — separates large document files from relational application data and works well with a Next.js deployment.
* **Trigger.dev** — document OCR and AI processing can take longer than a normal HTTP request and needs retries and durable execution.
* **OpenAI API** — handles document understanding and produces structured analysis that can be validated before being persisted.
* **PostHog** — provides product and reliability analytics while keeping raw document contents and sensitive extracted text out of analytics events.
* **Zod** — validates both incoming application data and AI output before it reaches the database or UI.

## System Boundaries

```text
app/
├── (marketing)/
├── (auth)/
├── dashboard/
├── upload/
├── cases/
├── history/
├── profile/
└── api/
    ├── documents/
    ├── cases/
    ├── tasks/
    ├── conversations/
    └── drafts/

components/
├── ui/
├── dashboard/
├── upload/
├── cases/
├── tasks/
└── assistant/

lib/
├── auth/
├── db/
├── storage/
├── ai/
├── documents/
├── ocr/
├── validation/
└── analytics/

trigger/
├── documents/
├── analysis/
└── ai/

prisma/
└── schema.prisma

data/
└── static/

public/
└── assets/
```

* `app/` — Next.js routes, pages, layouts, and authenticated API handlers.
* `app/api/` — short-lived authenticated mutations and reads; no long-running document processing.
* `components/` — reusable UI and feature components.
* `lib/` — shared infrastructure and domain services.
* `lib/ai/` — AI provider calls, prompts, structured output schemas, grounding, and response validation.
* `lib/documents/` — document metadata and processing orchestration.
* `lib/ocr/` — OCR integration and page/text normalization.
* `lib/storage/` — private document upload, retrieval, and deletion.
* `trigger/` — long-running and retryable processing workflows.
* `prisma/` — database schema and Prisma client configuration.
* `data/` — static application data only; uploaded user documents do not live here.
* `public/` — public application assets.

## Storage Model

### PostgreSQL

Stores application metadata and structured results:

* users
* documents
* cases
* extractions
* deadlines
* tasks
* required materials
* submission methods
* conversations
* drafts
* processing state
* notes

### Vercel Blob

Stores:

* original uploaded PDFs
* original uploaded images
* optional derived/OCR files

Original documents are immutable until the user explicitly deletes them.

Database records store the blob reference rather than the document contents.

### Access Model

* Documents are private.
* Blob access is never exposed as a permanent public URL.
* Server-side authorization is performed before returning document information or generating access URLs.
* A user can only access documents and cases they own.

## Database Schema

### `users`

Represents the application's user.

| Field       | Type     | Description           |
| ----------- | -------- | --------------------- |
| `id`        | String   | Internal primary key  |
| `clerkId`   | String   | Clerk user identifier |
| `createdAt` | DateTime | Account creation time |
| `updatedAt` | DateTime | Last update           |

**Relationships**

* One user → many documents
* One user → many cases
* One user → many conversations/drafts through their cases

---

### `documents`

Represents the original uploaded document.

| Field              | Type      | Description                            |
| ------------------ | --------- | -------------------------------------- |
| `id`               | String    | Primary key                            |
| `userId`           | String    | Owner                                  |
| `fileName`         | String    | Original filename                      |
| `mimeType`         | String    | PDF/image type                         |
| `blobPath`         | String    | Private Vercel Blob reference          |
| `fileSize`         | Int       | File size                              |
| `pageCount`        | Int?      | Number of pages when known             |
| `processingStatus` | Enum      | Upload/processing/result/failure state |
| `uploadedAt`       | DateTime  | Upload timestamp                       |
| `deletedAt`        | DateTime? | Soft-delete timestamp if used          |

**Relationships**

* Belongs to one user.
* Has one analyzed case.
* Has many extracted facts.

---

### `cases`

Represents the actionable interpretation of one uploaded document.

| Field             | Type      | Description                                               |
| ----------------- | --------- | --------------------------------------------------------- |
| `id`              | String    | Primary key                                               |
| `userId`          | String    | Owner                                                     |
| `documentId`      | String    | Source document                                           |
| `documentType`    | String    | Classified document type                                  |
| `issuer`          | String?   | Organization/person issuing it                            |
| `recipient`       | String?   | Intended recipient                                        |
| `issueDate`       | DateTime? | Document issue date                                       |
| `actionStatus`    | Enum      | Required/recommended/not required/unknown/deadline passed |
| `urgency`         | Enum      | Critical/high/medium/low/unknown                          |
| `summary`         | Text      | Plain-language explanation                                |
| `primaryDeadline` | DateTime? | Main identified deadline                                  |
| `status`          | Enum      | Active/completed/etc.                                     |
| `createdAt`       | DateTime  | Creation time                                             |
| `updatedAt`       | DateTime  | Last update                                               |

**Relationships**

* Belongs to one document.
* Belongs to one user.
* Has many extractions.
* Has many deadlines.
* Has many tasks.
* Has many required materials.
* Has many submission methods.
* Has many conversations.
* Has many drafts.
* Has notes.

---

### `extractions`

Stores structured facts extracted from the source document.

| Field        | Type     | Description               |
| ------------ | -------- | ------------------------- |
| `id`         | String   | Primary key               |
| `caseId`     | String   | Case                      |
| `field`      | String   | Extracted field name      |
| `value`      | JSON     | Extracted value           |
| `confidence` | Decimal  | Model confidence          |
| `sourcePage` | Int?     | Page supporting the value |
| `sourceText` | Text?    | Supporting document text  |
| `createdAt`  | DateTime | Creation time             |

This allows the application to explain where important information came from rather than treating the AI response as an unexplained answer.

---

### `deadlines`

Stores deadlines identified from the document.

| Field         | Type      | Description                  |
| ------------- | --------- | ---------------------------- |
| `id`          | String    | Primary key                  |
| `caseId`      | String    | Case                         |
| `date`        | DateTime? | Deadline date                |
| `description` | Text      | What the deadline relates to |
| `confidence`  | Decimal   | Confidence in extraction     |
| `sourcePage`  | Int?      | Supporting page              |
| `createdAt`   | DateTime  | Creation time                |

A missing or uncertain deadline remains missing/uncertain. The system must never manufacture one.

---

### `tasks`

Represents actions the user may need to take.

| Field         | Type      | Description                 |
| ------------- | --------- | --------------------------- |
| `id`          | String    | Primary key                 |
| `caseId`      | String    | Case                        |
| `title`       | String    | Short action                |
| `description` | Text      | Plain-language instructions |
| `required`    | Boolean   | Whether explicitly required |
| `dueDate`     | DateTime? | Task-specific deadline      |
| `status`      | Enum      | Pending/completed           |
| `sourcePage`  | Int?      | Supporting page             |
| `createdAt`   | DateTime  | Creation time               |
| `completedAt` | DateTime? | Completion time             |

Tasks are persisted separately so users can check them off without modifying the original analysis.

---

### `requiredMaterials`

Represents documents or information needed to complete a task.

| Field         | Type    | Description                   |
| ------------- | ------- | ----------------------------- |
| `id`          | String  | Primary key                   |
| `caseId`      | String  | Case                          |
| `name`        | String  | Required document/information |
| `description` | Text?   | Additional explanation        |
| `required`    | Boolean | Required vs optional          |
| `sourcePage`  | Int?    | Supporting page               |

---

### `submissionMethods`

Represents where/how the document says an action should be completed.

| Field          | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| `id`           | String  | Primary key                                  |
| `caseId`       | String  | Case                                         |
| `method`       | String  | Mail/email/portal/in-person/etc.             |
| `destination`  | String? | Address, email, office, or other destination |
| `instructions` | Text?   | Submission instructions                      |
| `sourcePage`   | Int?    | Supporting page                              |

---

### `conversations`

Stores AI Help conversations for a case.

| Field       | Type     | Description           |
| ----------- | -------- | --------------------- |
| `id`        | String   | Primary key           |
| `caseId`    | String   | Case                  |
| `userId`    | String   | User                  |
| `createdAt` | DateTime | Conversation creation |

---

### `messages`

Stores individual user/assistant messages.

| Field            | Type     | Description       |
| ---------------- | -------- | ----------------- |
| `id`             | String   | Primary key       |
| `conversationId` | String   | Conversation      |
| `role`           | Enum     | User/assistant    |
| `content`        | Text     | Message content   |
| `createdAt`      | DateTime | Message timestamp |

AI Help is scoped to the case so answers can be grounded in the relevant uploaded document.

---

### `drafts`

Stores editable response drafts generated by AI.

| Field       | Type     | Description           |
| ----------- | -------- | --------------------- |
| `id`        | String   | Primary key           |
| `caseId`    | String   | Case                  |
| `userId`    | String   | Owner                 |
| `type`      | Enum     | Email/letter/response |
| `content`   | Text     | Generated draft       |
| `createdAt` | DateTime | Creation time         |
| `updatedAt` | DateTime | Last edit             |

Drafts are suggestions only. bujhAI never sends them automatically.

---

### `caseNotes`

Stores user-created notes.

| Field       | Type     | Description   |
| ----------- | -------- | ------------- |
| `id`        | String   | Primary key   |
| `caseId`    | String   | Case          |
| `userId`    | String   | Owner         |
| `content`   | Text     | Note content  |
| `createdAt` | DateTime | Creation time |
| `updatedAt` | DateTime | Last update   |

---

## Core Relationships

```text
User
 ├── Documents
 │    └── Case
 │         ├── Extractions
 │         ├── Deadlines
 │         ├── Tasks
 │         ├── Required Materials
 │         ├── Submission Methods
 │         ├── Conversations
 │         │    └── Messages
 │         ├── Drafts
 │         └── Notes
```

The fundamental ownership chain is:

```text
User → Document → Case → Case Data
```

Every case-level resource must ultimately be authorized through that ownership chain.

## Document Processing Model

### Upload

1. User selects a PDF or image.
2. File is uploaded to private Blob storage.
3. `documents` record is created.
4. Processing status becomes `processing`.
5. A Trigger.dev job is started.
6. User is redirected to the case processing state.

### Processing

Trigger.dev performs:

```text
Document
   ↓
File validation
   ↓
PDF/image parsing
   ↓
OCR when required
   ↓
Page/text normalization
   ↓
AI classification
   ↓
Structured extraction
   ↓
Validation
   ↓
Persistence
   ↓
Case ready
```

The original document is never modified.

### Failure Handling

If processing fails:

* Persist a failed processing state.
* Preserve the original upload.
* Store a user-safe error message.
* Allow retry where appropriate.
* Do not create a misleading completed analysis.

## AI Analysis Model

### Document Analysis

Input:

* document pages/text
* OCR output when necessary

Output:

```text
DocumentAnalysis
├── documentType
├── issuer
├── recipient
├── issueDate
├── actionStatus
├── urgency
├── summary
├── deadlines[]
├── tasks[]
├── requiredMaterials[]
├── submissionMethods[]
├── consequences[]
├── uncertainties[]
└── confidence
```

Every important extracted fact should retain evidence such as:

* source page
* supporting text where appropriate
* confidence
* uncertainty state

### Evidence States

The system distinguishes:

```text
Explicit
→ directly stated in the document

Inferred
→ reasonable interpretation based on document evidence

Unknown
→ information cannot be determined

Not Found
→ information was searched for but was not present
```

The UI must not present inferred or uncertain information as an explicit fact.

### AI Help

AI Help receives the case's relevant document context and structured analysis.

Supported operations include:

* explaining the document
* answering questions
* explaining confusing sections
* explaining checklist items
* generating questions for a phone call
* generating response/email/letter drafts

The document remains the primary source.

### Draft Generation

Draft generation produces editable text.

```text
Case + User Instructions
        ↓
Grounded AI generation
        ↓
Draft validation
        ↓
Editable draft
```

The system never sends the generated draft.

## Environment Variables

```env
# Database
DATABASE_URL=
DATABASE_URL_UNPOOLED=
DATABASE_URL_APP=

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI
OPENAI_API_KEY=

# Blob Storage
BLOB_READ_WRITE_TOKEN=

# Background Jobs
TRIGGER_SECRET_KEY=
TRIGGER_PROJECT_REF=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Application
NEXT_PUBLIC_APP_URL=
```

### Configuration Notes

* Keep all secret keys server-side.
* Only variables explicitly required in browser code should use `NEXT_PUBLIC_`.
* `OPENAI_API_KEY`, database credentials, Blob credentials, and Trigger credentials must never be exposed to the client.
* Production and development environments should use separate credentials and storage.
* Uploaded documents must use private storage.
* AI and processing credentials should be rotatable without code changes.
* Database migrations should be managed through Prisma.
* Neon's default role has `BYPASSRLS`, which silently defeats RLS regardless of `FORCE ROW LEVEL SECURITY`. The app connects as a separate `app_user` role (no `BYPASSRLS`, created in `prisma/migrations/*_app_role`) via `DATABASE_URL_APP`; migrations still run as the privileged role via `DATABASE_URL_UNPOOLED`. Every server read/mutation on an RLS-protected table must go through `lib/db/withUser.ts`, not the bare `prisma` client — it sets `app.current_user_id` for the transaction, which the RLS policies check.
* `assertDocumentOwner`/`assertCaseOwner` (`lib/auth/ownership.ts`) distinguish "not found" from "not yours" via narrow `SECURITY DEFINER` lookup functions (`get_document_owner`, `get_case_owner`) that reveal only a row's owning `userId` — RLS alone can't tell the two cases apart since an unauthorized row is simply invisible.
* AI model names/configuration should be centralized rather than scattered through application code.

## Analytics Model

PostHog tracks application events such as:

```text
document_upload_started
document_uploaded
document_analysis_started
document_analysis_completed
deadline_viewed
task_completed
draft_generated
assistant_question_asked
case_completed
correction_reported
document_deleted
```

Analytics events must not contain:

* original document contents
* OCR text
* sensitive extracted text
* private user document data

Analytics should describe application behavior, not become a second document-storage system.

## Invariants

1. No long-running OCR or AI processing inside normal request handlers.
2. Original uploaded documents remain immutable until explicitly deleted.
3. Every document and case is owned by exactly one user in v1.
4. Every mutation performs server-side ownership authorization.
5. Case resources cannot be accessed independently of their owner.
6. AI output is validated before being persisted.
7. Important claims must be grounded in the uploaded document.
8. Explicit facts, inferred information, unknowns, and missing information remain distinguishable.
9. bujhAI never invents a deadline, requirement, contact method, consequence, or other document fact.
10. Important extracted information should retain source-page references.
11. AI-generated drafts remain editable and are never automatically sent.
12. External actions remain under explicit user control.
13. Raw document/sensitive text is excluded from ordinary analytics events.
14. The database stores structured metadata; object storage stores document files.
15. The system is designed around the outcome of completing paperwork tasks, not merely producing document summaries.
16. v1 does not autonomously submit forms, log into external portals, send communications, provide legal representation, or perform other external actions on the user's behalf.
