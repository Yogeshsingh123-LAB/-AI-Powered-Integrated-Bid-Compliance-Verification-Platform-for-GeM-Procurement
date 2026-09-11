# MyGeM text chat and restricted tracking

The chatbot supports English, Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi,
Gujarati, Kannada, Malayalam and Punjabi text, FAQs, application tracking,
support tickets, escalation and administrator replies. Voice input is not included.

## Tracking access

- Users sign in and select their submitted tender in Track bid. Cards show the tender
  title, Tender ID, submission date and recorded status. No application UUID is entered.
- `GET /api/chat/bids` searches the signed-in user's bids by tender title or Tender ID,
  with literal, case-insensitive matching (including slash, percent and underscore).
  It returns 20 records per page, newest first, with an offset and `has_more` flag.
  Empty accounts, empty search results, loading, errors and retry are distinct UI states.
- `POST /api/chat/track` performs an exact, parameterized, owner-scoped lookup.
  The selected card supplies its internal reference automatically, refreshing status
  when opened. Back returns to the same search/page; Refresh fetches current records.
  Even administrators cannot use this endpoint to track another person's application.
- Only the reference, mapped status, submission date, review date and next-action code
  are returned by the detail endpoint; the list also includes tender title and Tender ID.
  No document contents, government identifiers, scores or reviewer notes are loaded.
- Automated compliance findings are shown as under review, not as a final approval.
  Unknown states are shown as unavailable. There is no invented last-updated date:
  the existing bid table records submission and review dates only.
- The UI renders tracking values directly. Application and ticket records are never
  passed to the AI provider. A user can still type personal information into a general
  AI question; the About panel explains not to share credentials or identity documents.
- There is no anonymous lookup and no OTP workflow. Existing login verifies ownership.
- Database-backed counters limit application lookups to 10 per minute per account,
  bid list searches to 60, AI chat to 30, ticket creation to 5, and support messages/escalations to 20.
  These counters are shared across workers. Tracking never changes procurement records;
  only abuse-control counters are written by its rate-limit dependency.
- Missing and other users' references return the same 404 message. Responses containing
  tracking/support records use `Cache-Control: no-store`.

## Support operations

Applicants use Raise ticket to enter a subject and message, and optionally select an
owned bid using the tender picker. The internal reference is attached automatically.
Save the returned full ticket UUID. Track ticket opens its status and latest
100 messages; Request escalation records a single escalation timestamp. The same action
is idempotent. Resolved tickets cannot receive applicant messages or be escalated.

Administrators open Ask MyGeM → Support inbox. The inbox is paginated in batches of 50
and flags escalated tickets. Administrators can reply, resolve and reopen tickets.
Only administrators have these endpoints; ordinary procurement officers do not.

The inbox sends a presence heartbeat every 20 seconds and presence expires after 60
seconds. Live support displays availability based on that heartbeat. Replies refresh
every 10 seconds while the ticket is open. When nobody is online, applicants can leave
a ticket and return for a reply. This requires real staff: there is no simulated agent,
automatic response-time guarantee, email/SMS delivery, or connection to the official GeM
helpdesk. Support messages remain in the language their authors used.

## Language and formatting

The compact globe selector lists native language names and remembers the selection in
local browser storage. Menus, support forms, statuses, system errors, window controls
and dates have local translations. Auto detects supported scripts and common Hinglish
words. Hindi and Marathi share Devanagari, so Marathi word hints are used; select the
language explicitly for ambiguous or Romanized regional text. User and agent messages
are preserved in their original language. Changing the language starts a fresh AI chat.

The existing AI provider receives an explicit language and plain-text instruction.
Responses containing TeX commands or math delimiters fall back to local plain-text
guidance. Local calculations group numbers using Indian formatting and label rounded
results as approximate. References and identifiers are never numerically reformatted.
Hindi/Hinglish local fallbacks cover common navigation, upload, tracking and support
questions. Each added regional language has local navigation and support guidance,
suggestions and calculation messages; broader answers require the configured AI provider.

## Floating panel

Drag the brand area of the navy header to move the panel. Drag any edge or corner
to resize it; the bottom-right grip is visible. The header and grip also accept arrow
keys (10 pixels, or 40 with Shift). Desktop defaults are 440 × 680 pixels with a
340 × 420 minimum, constrained to the visible viewport. Expand/restore preserves the
previous rectangle; minimize/close returns to the launcher without clearing messages.
The toolbar provides New conversation and Reset layout. Position and size are stored
locally, with no conversation or account data included in layout preferences.

At widths of 600 pixels or less, the panel fits the screen and manual dragging/resizing
is disabled. Expand and minimize remain available. Visual viewport changes accommodate
the on-screen keyboard. Short panels use scrollable menus and hide question suggestions
to keep the composer accessible. Menus use outline icons with text labels.

## Schema and startup

New tables: `support_tickets`, `support_messages`, `support_presence`, `chat_rate_limits`.
The existing backend startup's `Base.metadata.create_all` creates these additive tables.
Restart the backend after updating code. Existing installations managed exclusively by
Alembic can apply revision `c72f61a9e403` with `alembic upgrade head`.
No existing application status or document data is changed by this feature.

## Verification

Run these commands from their corresponding directories:

```powershell
# backend
.\venv\Scripts\python.exe tests/test_chat_support.py
.\venv\Scripts\python.exe tests/test_deployment.py

# frontend
npm test
npm run build
npm run lint
```

Both Python suites use temporary databases, never the configured cloud database.
The new suite checks ownership, minimal columns, non-enumerating errors, validation,
rate-limit reset, provider formatting, language fallbacks, ticket permissions and
the administrator reply/resolve/reopen lifecycle.

For a manual preview without real application data:

```powershell
# Terminal 1, backend
.\venv\Scripts\python.exe tests/chat_preview.py

# Terminal 2, frontend
$env:VITE_API_URL='http://127.0.0.1:8011'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Open `http://127.0.0.1:5175/tests/chat-preview.html` and use the synthetic applicant or
administrator buttons. The harness calls only the loopback fixture server for login.
It is not included in the production build. Close the preview and stop both processes
when finished. Use separate browser sessions for simultaneous applicant/agent testing,
because the app stores its session token in localStorage.
