# Chatbot audit — 13 September 2026

Reviewed the chat widget, request/history handling, rendering, window controls,
translation helpers, tracking and support panels, authenticated endpoints,
schemas, ownership checks, rate limits, support models, provider calls,
configuration, startup registration and Vercel routing. Checked the matching
chat modules in both backend/app and api/app.

## Fixed

- Gemini chat ignored GEMINI_API_KEY even though configuration supported it.
  Both credential validation and the provider now use the effective key.
- The default Gemini model was gemini-1.5-flash. The default now uses
  gemini-2.5-flash, which is listed without an announced shutdown date in
  [Google's model lifecycle documentation](https://ai.google.dev/gemini-api/docs/deprecations).
  Explicit AI_MODEL settings still take precedence.
- The 20-second AI wait exceeded the checked-in 15-second Vercel function limit.
  The handler now falls back after 10 seconds; provider transport waits are bounded.
  This leaves headroom but cannot guarantee completion if database access or
  platform startup is itself slow. Thread cancellation does not forcibly stop
  synchronous provider work, so transport timeouts remain necessary.
- Groq retried the same standard model even on standard-model failures.
  A second request is now reserved for switching from a failed web model.
- Groq's reasoning model received only 700 completion tokens. The request now
  allows 2,048 and selects low reasoning effort for GPT-OSS models. This reduces
  the risk of exhausting the budget before producing an answer; see
  [Groq's reasoning documentation](https://console.groq.com/docs/reasoning).
- A missing Gemini SDK could return a credentials error labelled as a successful
  AI answer. Provider failures and empty responses now use local guidance.
- Replies longer than the API's 4,000-character history limit made follow-up
  requests fail with HTTP 422. Outgoing context is now bounded without shortening
  the visible answer. Unicode characters are not split.
- Malformed successful responses could crash the message renderer. The widget
  now validates the answer and filters malformed suggestions before rendering.
- Initial support inbox/conversation/availability requests hid failures.
  Initial loads now surface errors, inbox loading is distinct from an empty
  inbox, and stale pagination responses cannot replace the selected page.
- Offline tracking guidance referred to an application-ID input that no longer
  exists. All supported language fallbacks now describe tender selection/search.
  English support guidance and auditor/verification-officer navigation were added.

## Verification

- Backend chat/support: 20 tests passed using a temporary SQLite database.
- Provider regressions: 9 tests passed using mocked transports.
- Frontend: 22 tests passed; production build passed.
- Targeted chatbot lint passed. Full frontend lint reports existing warnings in
  unrelated components.
- A live synthetic question to the configured Groq standard model returned a
  nonempty answer in 0.92 seconds. No procurement records were sent.
- Chat code parity checks and git diff whitespace checks passed.

## Remaining findings and limits

The broader deployment suite has two failures observed before the fixes:

1. Its configuration test expects postgresql+psycopg, but configuration preserves
   postgresql and the runtime tries installed drivers. This is a test/runtime
   expectation mismatch, not evidence that chat authentication is broken.
2. Document processing calls RegexExtractor.extract_all_fields, which does not
   exist. The upload regression reaches PROCESSING_FAILED. This is outside the
   chatbot implementation and was not changed here.

The local environment selects Groq. The modern google.genai SDK is absent from
the local virtual environment, although google-genai is declared in requirements.
Gemini was tested with mocks, not a live credential. Live web search, real cloud
database access, production deployment and interactive browser behavior were not
verified in this audit. Automated tests do not prove every runtime path is bug-free.

Changes are local: restart the backend and rebuild/redeploy the frontend and API
to apply them to a running deployment.
