# Project Overview

## About the Project

bujhAI is a full stack AI-powered bureaucracy navigator. The user uploads a confusing document — government letter, insurance notice, medical bill, financial document, university paperwork, housing notice, or other important correspondence — and bujhAI turns it into a clear action plan.

The product does not stop at summarization. It answers:

- What is this document?
- Why did I receive it?
- Do I need to take action?
- What is the deadline?
- What exactly do I need to do?
- What documents or information do I need?
- What happens if I do nothing?
- Where do I go or who do I contact?
- How can bujhAI help me complete the next step?

Core product philosophy:

> **Don't just understand the paperwork. Get it done.**

The entire process is tracked as a case with the original document, extracted facts, deadline, action checklist, and user progress.

---

## The Problem It Solves

Important paperwork is often written in legal, administrative, medical, financial, or institutional language that is difficult to understand. The user may know a document is important but still not know what they are supposed to do, when they need to do it, what they need to submit, or where to send it.

Generic AI tools can summarize documents, but bujhAI is specifically designed around the next action.

bujhAI turns:

**"I don't understand this paperwork."**

into:

**"I know what this is, what I need to do, when it is due, what I need, and where to do it."**

---

## Pages

```text
/                  → Homepage

/login             → Auth page

/dashboard         → Active cases, upcoming deadlines, recent documents

/upload            → Upload document + processing state

/cases/[id]        → Document analysis + action plan + checklist + AI help

/history           → Previous documents / completed cases

/profile            → User profile + preferences
```

---

## Navigation

Top navbar. Clean and minimal:

```text
Dashboard    Upload Document    History    Profile
```

No sidebar for v1.

Primary CTA throughout the app:

**Upload Document**

---

## Core User Flow

### Homepage

- Hero explains the core promise: understand paperwork and get the next step done
- Primary CTA → Upload Document
- Logged in users → dashboard
- Logged out users → login

### Onboarding

- User signs up / logs in
- Redirect → /dashboard
- No long onboarding questionnaire
- User profile is minimal and only collects information needed for the product

### Document Upload

- User uploads PDF or image
- Support multi-page documents
- OCR scanned documents when needed
- Show processing state
- Store original document securely
- On success → /cases/[id]

### Document Analysis

AI analyzes the uploaded document and extracts:

- Document type
- Issuer
- Recipient
- Issue date
- Deadline(s)
- Action required
- Required documents/information
- Submission/contact method
- Stated consequences of inaction
- Relevant reference/account/case numbers
- Source page for important extracted facts

The analysis must distinguish:

- Explicitly stated facts
- Inferred information
- Unknown / not found

Never invent a deadline, requirement, contact detail, or consequence.

### Action Plan

The case page shows the actionable result first:

```text
What this is

Why you received it

YOUR STATUS
Action required

DEADLINE
October 14, 2026

WHAT TO DO
1. Complete the required form
2. Gather supporting documents
3. Submit using the listed method

WHAT YOU NEED
[ ] Required document 1
[ ] Required document 2

WHERE TO SEND IT
Official contact / portal / address

IF YOU DO NOTHING
Document-supported consequence or "not stated"

NEXT STEP
[Draft a response]
```

- Action status options: Required / Recommended / No action / Unknown / Deadline passed
- Deadline shown prominently
- Tasks displayed as a checklist
- Required vs optional items clearly separated
- Important claims link back to source page when possible

### AI Help

User can ask questions about the uploaded document:

- "What is this?"
- "Do I need to do anything?"
- "When is this due?"
- "What do I need to send?"
- "Where do I send it?"
- "What happens if I do nothing?"
- "Explain page 3"

AI can also:

- Create a checklist
- Draft a response / email / letter
- Prepare questions for a call
- Explain confusing sections

The assistant uses the uploaded document as the primary source and clearly states uncertainty.

### Task Completion

- User checks off tasks
- User can add notes
- User can mark the case complete
- Original document and action history remain accessible
- Completed cases appear in History

### Dashboard

- Active cases
- Upcoming deadlines
- Actions needing attention
- Recently analyzed documents
- Quick Upload CTA

Example:

```text
3 actions need attention

Today
- Insurance appeal — due in 8 days

This week
- University documentation — due Friday

Recently analyzed
- Medical bill
- Housing notice
```

---

## Data Architecture

### Main Document Data

- Lives in `documents` table
- Stores original file reference, file type, upload timestamp, processing status
- Original document is immutable
- User can delete it

### Case Data

- Lives in `cases` table
- One case is created for each analyzed document
- Stores document type, issuer, action status, urgency, primary deadline, status

### Extracted Facts

- Lives in `extractions` table or structured JSON
- Each important field stores value, confidence, and source page/text where possible
- Used to generate the action plan

### Tasks

- Lives in `tasks` table
- Each task belongs to a case
- Stores title, description, required flag, due date, status, source page

### Required Materials

- Lives in `required_materials` table or case JSON
- Tracks documents/information the user needs before completing the action

### AI Conversations

- Lives in `interactions` table
- Scoped to a case
- Stores user/assistant messages and timestamps

---

## Features In Scope

- Homepage with hero, how it works, core value proposition, footer
- Top navbar — Dashboard, Upload Document, History, Profile
- Authentication
- PDF upload
- Image upload
- Multi-page document support
- OCR for scanned documents
- Secure original document storage
- AI document classification
- Structured extraction of dates, deadlines, actions, required materials, contacts, consequences
- Action status detection
- Urgency detection
- Evidence/source page references
- Plain-language document explanation
- Action-oriented result page
- Checklist with task completion
- Required vs optional materials
- Deadline display
- Contact / submission information
- Consequence explanation
- Case history
- AI Q&A grounded in uploaded document
- Response / email / letter drafting
- Call-question generation
- User notes
- Dashboard with active cases and upcoming deadlines
- Document and case deletion
- Basic AI uncertainty / confidence handling
- Key product analytics events

---

## Features Out of Scope

- Autonomous submission of forms, appeals, claims, or applications
- AI sending emails/messages without explicit user review
- Legal representation or legal advice
- Medical diagnosis or treatment recommendations
- Automated financial transactions or payments
- Automatic login or action inside arbitrary government/insurance portals
- Universal browser automation
- Complex multi-user / family case management
- Enterprise case-management workflows
- Fully autonomous bureaucracy management
- Browser extension
- Native mobile app
- Email inbox ingestion
- Cloud-drive import
- Calendar integration
- Advanced reminders / notification system
- Voice assistant
- Large-scale multi-document relationship mapping
- Multiple document/version editing workflows
- Payment/subscription system in v1

---

## AI Analysis Contract

```typescript
type ActionStatus =
  | "required"
  | "recommended"
  | "not_required"
  | "unknown"
  | "deadline_passed";

type Urgency =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "unknown";

type EvidenceState = "explicit" | "inferred" | "unknown" | "not_found";

/** A fact the model must mark rather than state as if confirmed — persisted as an `extractions` row. */
interface EvidenceField {
  text: string;
  evidenceState: EvidenceState;
  confidence: number;
  sourcePage?: number;
  sourceText?: string;
}

interface DocumentAnalysis {
  document: {
    type: string;
    issuer?: string;
    recipient?: string;
    issueDate?: string;
  };

  // Added during Feature 10 implementation to back the two dedicated
  // sections Feature 08 already built (What This Is / Why You Received It) —
  // not covered by `action.summary` alone.
  explanation: {
    whatThisIs: EvidenceField;
    whyReceived: EvidenceField;
  };

  action: {
    status: ActionStatus;
    urgency: Urgency;
    summary: string;
  };

  deadlines: Array<{
    date?: string;
    description: string;
    confidence: number;
    sourcePage?: number;
  }>;

  tasks: Array<{
    title: string;
    description?: string;
    required: boolean;
    dueDate?: string;
    sourcePage?: number;
  }>;

  requiredMaterials: Array<{
    name: string;
    description?: string;
    required: boolean;
    sourcePage?: number;
  }>;

  // Field names match the `submissionMethods` table (architecture-context.md),
  // not an Array<{type, value}> pair.
  submissionMethods: Array<{
    method: string;
    destination?: string;
    instructions?: string;
    sourcePage?: number;
  }>;

  // Always present — evidenceState is "not_found" when the document states
  // no consequence for inaction, rather than this being omitted.
  consequences: EvidenceField;

  uncertainties: string[];

  confidence: number;
}
```

Important AI rules:

- Ground important claims in the uploaded document
- Never fabricate deadlines or requirements
- Explicitly say when information is missing
- Show uncertainty for ambiguous or low-confidence results
- Separate document facts from general guidance
- Keep the user in control of external actions

---

## PostHog Events

```typescript
document_upload_started;      // { userId }
document_uploaded;            // { userId, fileType, pageCount }
document_analysis_started;    // { userId, caseId }
document_analysis_completed;  // { userId, caseId, actionStatus, urgency }
deadline_viewed;              // { userId, caseId }
task_completed;               // { userId, caseId, taskId }
draft_generated;              // { userId, caseId, draftType }
assistant_question_asked;     // { userId, caseId }
case_completed;               // { userId, caseId }
correction_reported;          // { userId, caseId, errorType }
document_deleted;             // { userId, caseId }
```

Do not send raw document contents or sensitive document text to ordinary analytics events.

---

## Target User

A person who receives important paperwork and:

- Does not fully understand what it means
- Is unsure whether action is required
- Wants to know the deadline quickly
- Needs help figuring out the exact next step
- May need to gather documents or information
- Wants guided help rather than a generic summary
- Is comfortable uploading documents to a modern web application

High-value use cases include government, insurance, medical billing, university, housing, financial, employment/benefits, and utility paperwork.

---

## Success Criteria

- User can upload a document and reach an actionable result without guidance
- The result page clearly answers what the document is, whether action is required, deadline, next step, required materials, and where to respond
- Important extracted facts can be traced to source pages when possible
- The system never presents an invented deadline as a confirmed fact
- Users can turn AI output into a concrete checklist
- Users can mark tasks complete and close a case
- AI Q&A stays grounded in the uploaded document
- Drafting assistance produces editable drafts and never sends them automatically
- Document processing failures are handled gracefully
- Critical extraction errors are rare and explicitly monitored
- Core product events fire correctly in PostHog
- UI is visually consistent and keeps the next action obvious
- The product measures progress toward the core outcome: **helping users get paperwork tasks done, not merely read summaries**
