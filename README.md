# bujhAI

Upload a confusing document — a government letter, insurance notice, medical bill, housing
notice, anything — and get a clear, grounded action plan back: what it is, why you got it,
whether you need to do anything, the deadline, and exactly what to do next.

Every claim bujhAI makes is grounded in the document itself. Facts are marked explicit,
inferred, unknown, or not found — nothing is presented as confirmed unless the document
actually says it. bujhAI never sends anything on your behalf; drafts, emails, and checklist
items it generates are always yours to review and act on.

## What it does

- **Upload** a PDF or photo of a document (drag-and-drop or file picker)
- **Understand** — OCR + AI analysis turns it into a structured action plan, with every fact
  traceable back to a source page
- **Get it done** — a checklist of what to do and what to gather, the deadline, where to send
  it, and an AI Help chat for follow-up questions or drafting a response
- **Dashboard & history** — upcoming deadlines, active cases, and a record of everything
  you've uploaded

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS — a Neo-Brutalist design system (hard shadows, sharp corners, no gradients)
- [Clerk](https://clerk.com) — authentication
- [Prisma 7](https://www.prisma.io) + Postgres ([Neon](https://neon.tech)) — Row-Level
  Security enforced at the database level, not just in application code
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — private document storage,
  short-lived signed URLs only
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — model calls via the `ai` SDK,
  structured output validated with Zod
- [Trigger.dev](https://trigger.dev) — background jobs for document parsing/OCR and AI
  analysis
- [PostHog](https://posthog.com) — product analytics

## Getting started

### Prerequisites

You'll need accounts/credentials for: a Postgres database (this project is built around
[Neon](https://neon.tech)'s pooled/unpooled connection model), [Clerk](https://clerk.com),
[Vercel Blob](https://vercel.com/docs/storage/vercel-blob), the
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway), [Trigger.dev](https://trigger.dev),
and (optional) [PostHog](https://posthog.com).

### Setup

```bash
npm install
cp .env.example .env.local   # fill in every value — see the comments in .env.example
npx dotenv -e .env.local -- npx prisma migrate deploy
```

Run the app. **Two processes are required** — the Next.js dev server does not execute
background jobs by itself:

```bash
npm run dev          # terminal 1 — the web app
npm run trigger:dev   # terminal 2 — the OCR/analysis pipeline worker
```

Without the second process, uploads will get stuck at "processing" — nothing polls or
executes the job without a connected Trigger.dev worker.

### Useful scripts

| Script | What it does |
|---|---|
| `npm run lint` | ESLint |
| `npm run db:verify-rls` | Two-account self-check that Row-Level Security actually blocks cross-user reads |
| `npm run db:verify-analysis` | Self-check for the AI-analysis persistence pipeline |
| `npm run db:verify-case-detail` | Self-check for case-page data loading + ownership |
| `npm run db:verify-signed-url` | Self-check for private-document signed-URL access/expiry |
| `npm run db:rotate-app-role-password` | Rotates the restricted `app_user` Postgres role's password |
| `npm run trigger:deploy` | Deploys the background jobs to Trigger.dev |

## Deployment

Built to deploy on [Vercel](https://vercel.com). Set the same environment variables from
`.env.example` in your Vercel project, and deploy the Trigger.dev jobs separately with
`npm run trigger:deploy`.
