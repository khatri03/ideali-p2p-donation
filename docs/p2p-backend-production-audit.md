# P2P fundraising backend: production audit

Audit date: 2026-08-28  
Backend reviewed: `D:\V4Ideas\Ideali\ideali.api`  
Scope: P2P signup, auth, fundraiser pages, donations/attribution, dashboard, teams, moderation, invitations, email, persistence, rate limits, tests.

## Release decision

**Do not release unchanged.** Fix P0 tenant-isolation defect before production. Fix P1 payment-attribution and concurrency defects before meaningful traffic. Current P2P feature design is solid in several places, but operational and integration assurance is below production bar.

## Actual flow

1. Charity enables P2P on a campaign. Backend requires a payment account and non-cancelled campaign, assigns immutable public campaign slug.
2. New supporter calls anonymous sign-up. Backend creates `Participant` user under campaign charity, then issues email-verification link.
3. Existing supporter logs in through normal Identity `LoginController`. Token derives `isFundraiser=true` from live `CampaignFundraiser` rows. Fresh token/refresh required after becoming fundraiser.
4. Authenticated, verified supporter reads join context and creates one `CampaignFundraiser` page per campaign. Page starts `Active` or `PendingApproval`.
5. Fundraiser sees `GET /api/member/my-fundraising` and detail endpoint: page state, raised amount, donor count, team, photo, recent supporters.
6. Public donor opens campaign/fundraiser page, submits existing donation flow with `FundraiserSlug`. `FundraiserAttributionService` resolves only active page on same campaign. Invoice stores `CampaignFundraiserId`; recurring donation retains it.
7. Public page, leaderboard, team pages and fundraiser console calculate totals from paid invoice items less refunds.
8. Charity can moderate pages/teams, invite supporters, configure email templates, and view invites/moderation data.

## Endpoint map

Relative controller routes inherit `/api/donation`; `~/api/...` routes are absolute.

### Supporter and fundraiser

- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/supporter-sign-up` anonymous, rate-limited.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/verify-email` anonymous, rate-limited.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/resend-verification` anonymous, rate-limited.
- Normal Identity login/refresh/logout endpoints handle fundraiser sign-in; token adds `isFundraiser` only when live fundraiser row exists.
- `GET /api/donation/campaign/{campaignUniqueId}/peer-to-peer/join` authenticated.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/join` authenticated, rate-limited.
- `GET /api/member/my-fundraising` authenticated, fundraiser’s page list/dashboard.
- `GET|PUT /api/member/my-fundraising/{fundraiserUniqueId}` authenticated, owned page only.
- `POST|DELETE /api/member/my-fundraising/{fundraiserUniqueId}/photo` authenticated, owned page only.
- `GET /api/campaigns/{campaignSlug}/{fundraiserSlug}` public page.
- `POST /api/donation/{campaignId}/donate` existing anonymous donation endpoint. Include `FundraiserSlug`; valid active page is attributed. `GET /api/donation/{campaignUniqueId}/donate` supplies campaign donation data.

### Public discovery and teams

- `GET /api/campaigns/{campaignSlug}/leaderboard` anonymous unless charity configured organizer-only board.
- `GET /api/campaigns/{campaignSlug}/teams` public browse.
- `GET /api/campaigns/{campaignSlug}/teams/{teamSlug}` public team page.
- `POST /api/campaigns/{campaignSlug}/teams` authenticated fundraiser creates team.
- `PUT /api/campaigns/{campaignSlug}/teams/{teamSlug}` captain updates team.
- `POST /api/campaigns/{campaignSlug}/teams/{teamSlug}/members` eligible fundraiser joins.
- `DELETE /api/campaigns/{campaignSlug}/teams/{teamSlug}/members/me` leaves team.
- `DELETE /api/campaigns/{campaignSlug}/teams/{teamSlug}/members/{memberUniqueId}` captain removes member.
- `POST /api/campaigns/{campaignSlug}/teams/{teamSlug}/captain/{memberUniqueId}` captain transfers captaincy.

### Charity management

- `GET|POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/settings` view/edit campaign permission.
- `GET /api/donation/campaign/{campaignUniqueId}/peer-to-peer/fundraisers` and `/{fundraiserUniqueId}` view permission.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/fundraisers/{fundraiserUniqueId}/moderate` edit permission.
- Equivalent `teams`, `teams/{teamUniqueId}`, and `teams/{teamUniqueId}/moderate` endpoints.
- `GET /api/donation/campaign/{campaignUniqueId}/peer-to-peer/invitations`, `/supporters`, `/preview`; `POST` send invitation.
- `GET|PUT /api/donation/campaign/{campaignUniqueId}/peer-to-peer/email-templates`; `POST /test`.
- `GET /api/donation/campaign/{campaignUniqueId}/peer-to-peer/invitation?token=...` public landing.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/invitation/accept` authenticated and email-bound.
- `POST /api/donation/campaign/{campaignUniqueId}/peer-to-peer/invitation/unsubscribe?token=...` public.

## Verified defects and gaps

### P0 — cross-tenant donor-contact mutation/data leak

`Donation.DonateService.cs:362-382` looks up an existing contact solely by primary email. `x.OrganizerId == organizerId` is commented out at line 367.

Impact: donation to Charity B using email already held by Charity A can load Charity A’s `Contact`, update their first name/last name/cell phone, and attach that cross-tenant contact to Charity B’s donation. P2P donation uses this exact method. This is tenant isolation failure, data corruption, and possible disclosure through later contact/donor views.

Required fix:

1. Reinstate `x.OrganizerId == organizerId` in lookup.
2. Add regression test: same email under two organizers must create/use only contact belonging to donation campaign organizer.
3. Data-repair investigation before release: identify `DonationCampaignInvoice.ContactInfo` whose contact organizer differs from campaign organizer.

### P1 — concurrency retry is broken after unique-index conflict

`FundraiserJoinService.cs:127-149` and `CampaignTeamService.cs:354-386` catch any `DbUpdateException` and retry new slug. Failed entity remains tracked as `Added` in EF Core after `SaveChangesAsync` failure. Next save attempts original invalid insert again; retry is not reliable. It also treats non-slug DB errors as slug collisions.

Impact: concurrent same-slug creation returns failed/500 instead of clean retry. Concurrent same user/campaign join can hit unique user index and gets misclassified as slug collision. User sees erroneous creation failure.

Required fix: inspect SQL unique-violation number/index; detach failed entity or create new DbContext/unit-of-work before retry; on `UX_CampaignFundraiser_Campaign_User` return existing page. Add SQL Server concurrency integration tests, not InMemory-only tests.

### P1 — payment attribution silently falls back when fundraiser page changes state

`FundraiserAttributionService.cs:34-52` returns `null` for unknown, paused, rejected, deleted, or newly disabled page. `DonateAsync` then charges donor and credits campaign, as documented in code.

Impact: a donor following a stale fundraiser link can believe they supported person, but donation is attributed only to campaign. No response warning, audit flag, or donor-facing confirmation distinguishes this.

Required product decision before release: either reject stale P2P donations with clear page-closed state, or preserve historical attribution with immutable page ID/token and explicitly show campaign-level fallback before charge. At minimum emit metric/audit event and test UI behavior.

### P1 — emailed invitation can be recorded as sent even when no email was queued

`FundraiserInvitationService.cs:374-397` persists invitation first. `SendInvitationEmailAsync` catches all send errors and only logs them (`:407-432`). Invitation remains `Sent`, consumes hourly quota, triggers recipient quiet window, and has no retry/outbox state.

Impact: charity dashboard reports sent invitation though recipient never received it. Recovery waits quiet window and is manual; failed invite emails are not operationally visible as failures.

Required fix: transactional outbox with delivery status/attempt count/error; separate `Queued` from `Sent`; idempotent worker retries; organizer-visible failure state.

### P1 — anonymous account verification can target unrelated account/campaign

`EmailVerificationService.ResendAsync` finds any unconfirmed user globally by `UserName` (`:317-322`) then issues a token for caller-selected public campaign. It does not prove user originated from that campaign or organizer.

Impact: user with an unconfirmed account from any charity can cause verification email and confirmation to be issued via an unrelated public campaign. It crosses tenancy/business scope and weakens intended signup binding.

Required fix: store and validate signup campaign/organizer on verification request or user onboarding record; resend only verification requests issued for same campaign/user; ensure only exact signup flow can initialize verification.

### P1 — rate limiting may collapse all public users behind production proxy

Rate policies partition directly on `HttpContext.Connection.RemoteIpAddress` (`Program.cs:115-212`). No `UseForwardedHeaders`, trusted proxy, or network configuration found.

Impact: behind reverse proxy/load balancer, all users may share proxy IP and hit global 429s. If deployment topology differs, throttling may be ineffective or inconsistent.

Required fix: configure trusted forwarded headers at ingress, test effective client IP in production-like environment, add telemetry for 429 partition behavior.

### P2 — photo validation trusts attacker-controlled metadata

`FundraiserConsoleService.IsAcceptablePhoto` accepts only extension, declared content type, and size (`:216-228`). No magic-byte/image decoding validation found.

Impact: disguised non-image content may enter file storage. Risk depends on storage/download headers and image processing pipeline.

Required fix: validate file signature and decode with image library/server-side processor; re-encode allowed image formats; store outside web root; force safe download/content-disposition policy.

### P2 — missing test classes at money/security boundaries

P2P service tests are extensive, but critical paths lack production-grade integration coverage:

- No test for organizer-scoped donor contact upsert.
- No SQL Server concurrency test for fundraiser/team slug/user uniqueness and retry behavior.
- No controller/integration test proving authentication, policy, ownership, and rate-limit behavior together.
- No end-to-end test from public page to payment request to attribution to fundraiser console/leaderboard.
- No outbox/delivery/retry test because invitation email state model is absent.
- No proxy/forwarded-header rate-limit test.

### P2 — suite is red

`dotnet test tests/Ideas.API.Tests/Ideas.API.Tests.csproj --no-build --no-restore` ran 605 tests: **600 passed, 5 failed**. Failures are outside P2P but block reliable release signal:

- 2x `MembershipRegistrationServiceTests`: intentionally throw `NotImplementedException` because test class is incomplete.
- `InvoiceServiceTests.PaymentStatusNotifiedAsync_WhenStatusIsNotSuccess_MarksItemsCancelled`: expected `Cancelled`, actual `PaymentPending`.
- 2x `MembershipInvoicePersistenceTests.ProcessAsync_WithSuccessfulPayment_PersistsInvoicePaymentAndAllocation` for ACH/PAD: expected allocation count 1, actual 0.

Build also emits many nullable-reference warnings. These are not P2P proof of failure, but red CI plus warnings reduces confidence in payment-adjacent changes.

### P3 — performance/scalability caution

`FundraiserConsoleService.GetMyPagesAsync` loops each owned page and runs totals/team/recent-supporter reads individually (`:50-64`, `:251-279`). A user with many pages produces N+1 queries. Leaderboard reads all campaign gifts into memory before ranking (`PeerToPeerLeaderboardService.cs:106-134`, `:343-351`).

Impact: latency/DB load grows with fundraiser count and donation volume.

Required fix: aggregate grouped totals in SQL, batch related data, paginate/cap analytics, add query-count and load tests.

## What is good

- Clear domain separation: controller, service, DTO, persistence mapping layers.
- Ownership authorization is mostly server-side and campaign-scoped. Public pages deliberately return controlled fields.
- Database uniqueness exists for fundraiser slug, one fundraiser per campaign/user, team slug, and one live team membership per fundraiser.
- Tokens use high entropy and stored hashes; invitation acceptance checks signed-in email against invite address.
- Donation totals consistently require paid invoices and subtract refunds; recurring donation preserves fundraiser attribution.
- Email templates sanitize HTML through dedicated sanitizer path; public donor names limit surname exposure.
- Many focused P2P unit tests exist, including authorization, visibility, state transitions, anonymity, and mapping constraints.

## Ratings

| Parameter | Score | Reason |
|---|---:|---|
| Domain modelling / feature coverage | 8/10 | Complete flows: signup, approval, pages, teams, invites, leaderboards, attribution. |
| Code structure / readability | 8/10 | Clear names, services divided by responsibility, useful comments. Some service classes are very large. |
| Authorization / privacy design | 7/10 | Strong ownership and public-data controls; P0 contact tenant bug and verification scope flaw lower score. |
| Data integrity / concurrency | 5/10 | Good database constraints; broken generic retry and missing realistic concurrency tests. |
| Payment correctness | 5/10 | Attribution mechanism is clear, but silent fallback and cross-tenant contact defect are unacceptable. |
| Email / operational reliability | 5/10 | Rate limits and token hashing good; no outbox or observable/retryable send state. |
| Performance / scale readiness | 6/10 | Indexes exist; several read-all/N+1 patterns need load validation. |
| Test quality / release confidence | 5/10 | Strong P2P unit breadth, but no full-system tests; suite currently red. |
| Observability / supportability | 5/10 | Structured logs exist; missing business metrics, delivery outcomes, and reconciliation signals. |
| Overall production readiness | **5.5/10** | Solid foundation. Not production-ready unchanged due P0/P1 defects and red suite. |

## Priority release plan

1. **Block release:** fix organizer scope in donor contact lookup; write test; audit/repair affected data.
2. Fix retry handling for unique constraints; add real SQL Server parallel-request tests.
3. Decide and implement stale-page donation behavior; test UI/API/payment confirmation together.
4. Add invitation outbox and delivery states with retry/monitoring.
5. Bind verification resend to original campaign/onboarding context.
6. Configure/test proxy-aware rate limiting.
7. Add file-content validation and safe storage controls.
8. Make test suite green, then add P2P E2E and production-like load tests.

## AI coding-agent instructions

Do not paper over failures by broad exception catches. Preserve existing route contracts unless frontend/backend route changes are coordinated. Every fix must include regression tests. For P0/P1 fixes, use SQL Server integration tests where EF/InMemory cannot enforce unique indexes, transactions, filtered indexes, or realistic concurrency. Do not release until full backend suite is green and new P2P E2E flow passes.
