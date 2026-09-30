
# Product Requirements Document — Meetly AI

**Product:** Meetly AI
**Type:** AI Meeting Assistant / SaaS
**Primary platform:** Web
**Status:** MVP
**Target stack:** Next.js 16 + TypeScript + Supabase + Meeting BaaS + LLM + shadcn/ui
**Starting point:** `juliusjoska/nextjs-saas-starter`

---

## 1. Product Vision

Meetly AI automatically joins online meetings, captures the conversation, generates a transcript, and turns the meeting into useful structured information.

Instead of manually taking notes, the user should be able to:

> **Paste a Google Meet link → Meetly joins → meeting happens → transcript is generated → AI produces notes and action items.**

The product should feel like a lightweight alternative to tools such as Fathom, without trying to reproduce every feature initially.

---

# 2. Problem

People frequently leave meetings with:

* incomplete notes
* forgotten decisions
* unclear action items
* difficulty finding something someone said
* no reliable meeting history
* time wasted manually summarizing recordings

Meetly solves this by automatically converting meetings into searchable knowledge.

---

# 3. Target Users

### Primary user

Individual professionals who attend multiple online meetings.

Examples:

* Software developers
* Startup founders
* Product managers
* Salespeople
* Recruiters
* Consultants
* Freelancers

### Secondary user

Small teams that want a shared meeting archive.

---

# 4. MVP Goal

The MVP must prove one core workflow:

```text
User signs up
      ↓
Dashboard
      ↓
Create Meeting
      ↓
Paste Google Meet URL
      ↓
Meetly Bot joins meeting
      ↓
Meeting is recorded/transcribed
      ↓
Webhook received
      ↓
AI processes transcript
      ↓
Meeting summary generated
      ↓
User views meeting
```

The MVP is successful if a real user can complete this entire flow without developer intervention.

---

# 5. User Flow

## 5.1 Signup

User visits:

```text
/
```

Clicks:

**Get Started**

↓

Signup:

```text
Email
Password
```

Optional later:

```text
Continue with Google
```

↓

User is authenticated through Supabase Auth.

The selected starter already provides Supabase authentication infrastructure. ([GitHub][1])

---

# 6. Dashboard

Route:

```text
/dashboard
```

### Dashboard should display

```text
Good morning, Nishant

[ + New Meeting ]

------------------------------------

Meetings
24

This Week
8

Minutes Recorded
312

Action Items
17

------------------------------------

Recent Meetings

Project Planning
Today · 45 min
12 action items

Client Call
Yesterday · 32 min
6 action items

Engineering Sync
Sep 28 · 51 min
4 action items
```

### Empty state

If the user has no meetings:

```text
No meetings yet

Connect your first meeting and let
Meetly take the notes for you.

[ + Start Your First Meeting ]
```

---

# 7. Create Meeting

Route:

```text
/dashboard/meetings/new
```

### UI

```text
Start a new meeting

Meeting URL

[ https://meet.google.com/........ ]

Bot name

[ Meetly Notetaker ]

        [ Join Meeting ]
```

Initially support:

### Google Meet

Later:

* Zoom
* Microsoft Teams

---

# 8. Meeting Creation

When the user clicks:

**Join Meeting**

Frontend calls:

```http
POST /api/meetings
```

Backend:

1. Authenticate user.
2. Validate meeting URL.
3. Create meeting record in Supabase.
4. Call Meeting BaaS.
5. Store returned bot ID.
6. Return meeting ID.
7. Redirect user to meeting status page.

Conceptually:

```text
Next.js
   ↓
Supabase
   ↓
Meeting BaaS
   ↓
Google Meet
```

---

# 9. Meeting Database Model

## `meetings`

```text
id
user_id
title
meeting_url
bot_id
status
started_at
ended_at
duration_seconds
recording_url
transcript_status
summary_status
created_at
updated_at
```

### Status

```text
scheduled
joining
in_progress
processing
completed
failed
```

---

# 10. Meeting Status Page

Route:

```text
/dashboard/meetings/[id]
```

While bot is joining:

```text
Preparing your meeting...

Meetly is joining the meeting.

● Connecting
○ Recording
○ Processing
○ Complete
```

When bot joins:

```text
Meetly is in the meeting

Recording and transcription are active.
```

After meeting:

```text
Processing meeting...

✓ Recording received
✓ Transcript generated
● Generating AI notes
```

---

# 11. Meeting BaaS Integration

Meeting BaaS is the meeting infrastructure layer.

Meetly should **not** implement its own browser bot infrastructure.

Responsibilities:

```text
Meetly
  ↓
Meeting BaaS
  ↓
Meeting platform
```

Meeting BaaS handles:

* joining the meeting
* bot presence
* recording
* transcription
* meeting completion events

Meetly handles:

* user accounts
* meetings database
* AI processing
* summaries
* action items
* UI
* search

---

# 12. Webhook System

Endpoint:

```text
POST /api/webhooks/meeting-baas
```

Meeting BaaS sends events to Meetly.

Example lifecycle:

```text
bot.joining
     ↓
bot.joined
     ↓
bot.in_meeting
     ↓
bot.completed
```

On completion:

```text
Meeting BaaS
     ↓
Webhook
     ↓
Meetly API
     ↓
Save transcript
     ↓
AI processing
```

The exact Meeting BaaS webhook payload/schema should be implemented against its current API documentation rather than hard-coded from an older example.

---

# 13. Transcript

Database table:

## `transcript_segments`

```text
id
meeting_id
speaker
speaker_id
text
start_time
end_time
created_at
```

Example:

```text
00:03:12

Nishant:
We should launch the beta next Friday.

00:03:19

Alex:
I agree, but we need to finish authentication first.
```

---

# 14. Meeting Detail Page

Once processing is complete:

```text
/dashboard/meetings/[id]
```

### Header

```text
Project Planning

Today · 45 minutes

[ Share ] [ Delete ]
```

### Navigation

```text
Overview
Transcript
Ask AI
```

---

# 15. AI Overview

The primary meeting page should contain:

## Summary

A concise summary of the meeting.

Example:

> The team discussed the beta launch timeline, authentication requirements, and onboarding flow. The team agreed to target Friday for the beta provided authentication is completed.

---

## Key Topics

```text
• Beta launch
• Authentication
• User onboarding
• Deployment
```

---

# 16. Decisions

AI should identify explicit decisions.

Example:

```text
Decisions

✓ Beta launch targeted for Friday
✓ Google OAuth will be included in beta
✓ Onboarding will use a three-step flow
```

Database:

## `meeting_insights`

```text
id
meeting_id
type
content
created_at
```

Where:

```text
type =
summary
key_topic
decision
action_item
```

---

# 17. Action Items

The AI should extract:

```text
Action Items

☐ Nishant — Finish Supabase authentication
   Due: Friday

☐ Alex — Prepare deployment environment
   Due: Thursday

☐ Sarah — Review onboarding UI
   Due: Friday
```

Eventually users should be able to:

* mark complete
* edit
* assign
* add deadline

For MVP, display-only is sufficient.

---

# 18. Transcript Page

Route:

```text
/dashboard/meetings/[id]/transcript
```

Example:

```text
Transcript

00:00

Nishant
Let's start with the launch timeline...

00:02

Alex
The backend should be ready by Thursday...

00:05

Nishant
Then let's target Friday.
```

Features for MVP:

* speaker names
* timestamps
* scrolling
* searchable text

---

# 19. Ask AI

Route:

```text
/dashboard/meetings/[id]/ask
```

User can ask:

```text
┌───────────────────────────────────────┐
│ What did Alex say about the launch?   │
└───────────────────────────────────────┘

                         [ Ask ]
```

Response:

```text
Alex said the backend should be ready
by Thursday, allowing the team to target
a Friday beta launch.
```

### MVP implementation

Initially, simply send the transcript to the LLM with the question.

Later:

```text
Transcript
    ↓
Chunking
    ↓
Embeddings
    ↓
pgvector
    ↓
Semantic search
    ↓
Relevant transcript chunks
    ↓
LLM
```

---

# 20. AI Processing Pipeline

After transcript completion:

```text
Transcript
    ↓
Normalize
    ↓
Split into chunks
    ↓
LLM
    ↓
Structured JSON
```

Expected output:

```json
{
  "summary": "...",
  "topics": [],
  "decisions": [],
  "action_items": []
}
```

Then save the results into Supabase.

---

# 21. AI Prompt Requirements

The AI should:

* summarize only information present in the transcript
* avoid inventing decisions
* identify explicit commitments
* identify speakers when possible
* distinguish discussion from decisions
* extract action items
* preserve uncertainty

Example:

```text
You are an AI meeting analyst.

Analyze the following meeting transcript.

Return:
1. concise summary
2. key topics
3. explicit decisions
4. action items
5. unresolved questions

Do not invent information that is not present
in the transcript.
```

---

# 22. Supabase Architecture

Supabase will provide:

```text
Authentication
      +
PostgreSQL
      +
Row Level Security
      +
Storage
      +
Realtime
```

The selected starter already includes Supabase Auth/database, RLS, and the dashboard infrastructure. ([GitHub][1])

---

# 23. Core Database

### `profiles`

```text
id
email
full_name
avatar_url
created_at
```

### `meetings`

```text
id
user_id
title
meeting_url
bot_id
status
started_at
ended_at
duration_seconds
recording_url
created_at
updated_at
```

### `transcript_segments`

```text
id
meeting_id
speaker
speaker_id
text
start_time
end_time
```

### `meeting_insights`

```text
id
meeting_id
type
content
metadata
created_at
```

### Later: `action_items`

```text
id
meeting_id
assignee
description
due_date
completed
created_at
```

---

# 24. Security

Every user must only be able to access their own meetings.

Supabase RLS:

```text
User A
  ↓
Only User A meetings

User B
  ↓
Only User B meetings
```

Never trust:

```text
/api/meetings?id=someone-elses-id
```

The server must verify ownership.

---

# 25. Application Routes

```text
/
├── /login
├── /register
│
└── /dashboard
    │
    ├── /
    │
    ├── /meetings
    │
    ├── /meetings/new
    │
    ├── /meetings/[id]
    │
    ├── /meetings/[id]/transcript
    │
    ├── /meetings/[id]/ask
    │
    └── /settings
```

API:

```text
/api/meetings
/api/meetings/[id]

/api/webhooks/meeting-baas

/api/ai/summarize
/api/ai/ask
```

---

# 26. Project Structure

Based on the starter:

```text
src/
├── app/
│   ├── (landing)/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── meetings/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── transcript/
│   │   │       └── ask/
│   │   └── settings/
│   │
│   └── api/
│       ├── meetings/
│       ├── ai/
│       └── webhooks/
│           └── meeting-baas/
│
├── components/
│   ├── meetings/
│   ├── transcript/
│   ├── dashboard/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── meeting-baas/
│   ├── ai/
│   └── utils/
│
└── types/
```

---

# 27. MVP Features

### Must Have

| Feature           | MVP |
| ----------------- | --- |
| Signup/Login      | ✅   |
| Dashboard         | ✅   |
| Create meeting    | ✅   |
| Google Meet URL   | ✅   |
| Meeting BaaS bot  | ✅   |
| Bot status        | ✅   |
| Recording         | ✅   |
| Transcript        | ✅   |
| AI summary        | ✅   |
| Key topics        | ✅   |
| Decisions         | ✅   |
| Action items      | ✅   |
| Meeting history   | ✅   |
| Transcript search | ✅   |
| RLS/security      | ✅   |

### Later

| Feature                | Phase |
| ---------------------- | ----- |
| Ask AI                 | MVP+  |
| Google Calendar        | V2    |
| Zoom                   | V2    |
| Teams                  | V2    |
| Speaker identification | V2    |
| Team workspaces        | V2    |
| Shared meetings        | V2    |
| Action-item assignment | V2    |
| Slack integration      | V2    |
| Email follow-up        | V2    |
| CRM integrations       | V3    |
| Advanced analytics     | V3    |

---

# 28. Non-Goals for MVP

Do **not** build these initially:

* mobile application
* desktop application
* complex billing
* CRM integrations
* Slack integration
* calendar synchronization
* advanced analytics
* team administration
* enterprise SSO
* custom AI model

The goal is to get the **meeting → transcript → AI notes** pipeline working first.

---

# 29. Success Criteria

The MVP is considered complete when:

### User

```text
Signup
 ↓
Login
 ↓
Dashboard
 ↓
Paste Google Meet URL
 ↓
Click Join
```

### System

```text
Create DB record
 ↓
Create Meeting BaaS bot
 ↓
Bot joins meeting
 ↓
Meeting completes
 ↓
Webhook received
 ↓
Transcript saved
 ↓
AI processing
 ↓
Summary saved
```

### User

```text
Open meeting
 ↓
Read summary
 ↓
Read decisions
 ↓
See action items
 ↓
Read transcript
```

If this works reliably with real meetings, **we have the first usable version of Meetly AI.**

---

# 30. Phase Plan

## Phase 1 — Foundation

```text
Next.js starter
+
Supabase
+
Authentication
+
Dashboard
+
Database schema
```

## Phase 2 — Meeting Infrastructure

```text
Create meeting
+
Meeting BaaS
+
Bot lifecycle
+
Webhooks
```

## Phase 3 — Intelligence

```text
Transcript
+
LLM summary
+
Topics
+
Decisions
+
Action items
```

## Phase 4 — Product Polish

```text
Search
+
Ask AI
+
Better dashboard
+
Loading/error states
+
Responsive UI
```

---

# 31. The Most Important Architecture Decision

Keep the responsibilities clean:

```text
┌─────────────────────────────────┐
│          Next.js App             │
│                                  │
│ Dashboard                        │
│ Meetings                         │
│ Transcript                       │
│ AI UI                            │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│            Supabase              │
│                                  │
│ Auth                             │
│ PostgreSQL                       │
│ RLS                              │
│ Storage                          │
└───────────────┬─────────────────┘
                │
                │
       ┌────────┴─────────┐
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Meeting BaaS│    │     LLM     │
│             │    │             │
│ Bot         │    │ Summary     │
│ Recording   │    │ Decisions   │
│ Transcript  │    │ Actions     │
└─────────────┘    └─────────────┘
```

This keeps **Meeting BaaS responsible for meeting infrastructure**, **Supabase responsible for application data/auth**, and **the LLM responsible for intelligence**.

### Recommended first implementation order

**Don't start with the AI.**

Build in this exact order:

```text
1. Supabase Auth
2. Meetings table
3. Dashboard
4. New Meeting page
5. Meeting BaaS API integration
6. Webhook
7. Save transcript
8. Meeting detail page
9. AI summary
10. Action items
11. Ask AI
```

That order gives you a working product at every major checkpoint instead of building a beautiful UI around a fake meeting workflow.

[1]: https://github.com/juliusjoska/nextjs-saas-starter?utm_source=chatgpt.com "GitHub - juliusjoska/nextjs-saas-starter: Next.js 16 SaaS starter — Supabase auth, Stripe billing, shadcn/ui, multi-tenant. CI/CD included. · GitHub"
