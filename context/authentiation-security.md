# Authentication & Security — bujhAI

> Scope: v1 authentication and authorization only. This document is based on the bujhAI project overview and does not introduce new product features or roles.

## 1. Authentication

**Recommended authentication method:** managed email authentication.

- Users sign up or log in through the `/login` page.
- Require a verified email before accessing protected user data.
- Use secure, HTTP-only session cookies.
- Sessions must expire and be refreshable securely.
- Rate-limit login and verification attempts.
- Do not reveal whether an email address belongs to an existing account through error messages.
- Never store authentication secrets or session tokens in client-accessible storage.
- Authentication is only for identifying the user; authorization must still enforce ownership on every protected resource.

## 2. User Role

bujhAI v1 has **one application role: `user`**.

### `user` can

- Access their own dashboard.
- Upload PDF and image documents.
- View and delete their own documents.
- View their own cases and case history.
- View AI analysis for their own documents/cases.
- Ask questions about their own uploaded documents.
- Generate editable drafts, call questions, and checklists for their own cases.
- Create and update their own task progress and notes.
- Mark their own cases complete.
- Manage their own profile and preferences.

### `user` cannot

- Access another user's documents, cases, tasks, notes, or AI conversations.
- Read or modify another user's data by changing an ID in a request.
- Change ownership of a document, case, task, or interaction.
- Change their role or authorization level.
- Access another user's storage objects.
- Submit forms, appeals, claims, applications, emails, or messages automatically through bujhAI.
- Perform actions inside external government, insurance, university, housing, financial, or other portals through bujhAI.

## 3. Row-Level Security

Every user-owned database record must be tied to the authenticated user.

### Direct ownership

For tables with `user_id`:

```text
documents:
  user_id = authenticated_user_id

cases:
  user_id = authenticated_user_id

interactions:
  user_id = authenticated_user_id
```

### Child records

For tables without a direct `user_id`, authorization must follow the parent:

```text
tasks:
  task.case_id → cases.user_id = authenticated_user_id

required_materials:
  required_material.case_id → cases.user_id = authenticated_user_id
```

### Required rules

- Enable RLS on every user-owned table.
- Default to deny.
- `SELECT`: only records owned by the authenticated user.
- `INSERT`: force/check ownership against the authenticated user.
- `UPDATE`: only records owned by the authenticated user.
- `DELETE`: only records owned by the authenticated user.
- Never trust a client-provided `user_id`.
- Never allow the client to change ownership fields.
- Apply the same ownership check to document storage objects.
- Test every CRUD operation with two different user accounts.

## 4. Error Handling

| Failure | User-facing behavior | Required handling |
|---|---|---|
| Invalid login | `Invalid login details.` | Do not reveal whether the account exists. |
| Expired/invalid verification | `This verification link is invalid or expired.` | Reject the request and allow a new verification attempt. |
| Too many auth attempts | `Too many attempts. Try again later.` | Rate-limit the request. |
| Unauthenticated protected request | `Please log in to continue.` | Reject access. |
| Unauthorized document/case | `You don't have access to this item.` | Enforce ownership; do not leak private data. |
| Missing document/case | `We couldn't find that item.` | Do not expose database details. |
| Invalid upload | `This file can't be uploaded. Check the file type and size.` | Validate file type and size server-side. |
| Upload failure | `Upload failed. Please try again.` | Clean up incomplete uploads. |
| Document processing failure | `We couldn't finish analyzing this document.` | Mark processing as failed and allow retry. |
| AI analysis failure | `We couldn't analyze this document right now.` | Do not create misleading or incomplete confirmed results. |
| Low-confidence extraction | Show the information as uncertain/unknown. | Never present an uncertain deadline or requirement as confirmed. |
| Database failure | `Something went wrong. Please try again.` | Log the internal error without exposing implementation details. |
| Delete failure | `We couldn't delete this document. Please try again.` | Do not report successful deletion unless deletion actually completed. |
| Unexpected error | `Something went wrong. Please try again.` | Record a safe internal error; never expose secrets or document contents. |

### Error logging

Log only what is needed to diagnose the failure:

- Timestamp
- Authenticated user ID when appropriate
- Error type/code
- Request/correlation ID
- Related document/case ID when appropriate
- Success/failure result

Do **not** log raw document contents, sensitive document text, authentication tokens, or other sensitive user data.

## 5. Security Edge Cases Before Launch

- User attempts to access another user's `/cases/[id]`.
- User changes a document/case ID to access another record.
- User changes `user_id` in a request.
- User attempts to change ownership through an update.
- User accesses another user's storage object.
- Expired authentication session.
- Expired or reused verification link.
- Multiple login attempts.
- Duplicate uploads.
- Unsupported file type.
- Oversized file.
- Corrupted document.
- Malicious file content.
- User deletes a document while it is being processed.
- Document processing fails midway.
- AI analysis returns incomplete results.
- AI extracts an ambiguous or missing deadline.
- AI invents information that is not supported by the document.
- User deletes a document/case and then tries to access it.
- User refreshes or retries an upload/processing request and accidentally creates duplicates.
- Sensitive document content appears in analytics or error logs.
- AI-generated drafts are accidentally treated as automatically sent actions.

## 6. Launch Security Checklist

Before launch:

- [ ] Authentication protects `/dashboard`, `/upload`, `/cases/[id]`, `/history`, and `/profile`.
- [ ] Every user-owned table has RLS enabled.
- [ ] Cross-user database access tests pass.
- [ ] Cross-user storage access tests pass.
- [ ] Client cannot change ownership.
- [ ] Authentication and verification endpoints are rate-limited.
- [ ] Upload validation happens server-side.
- [ ] Failed processing does not create misleading results.
- [ ] AI uncertainty is preserved.
- [ ] Raw document contents are excluded from analytics and error logs.
- [ ] Document/case deletion is enforced consistently.
- [ ] External actions always remain under the user's control.
