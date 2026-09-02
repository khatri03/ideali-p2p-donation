# Peer-to-peer lifecycle emails — scope, flow and execution plan

**Status:** deferred to the next phase of the peer-to-peer work. The screen is built and the tab has been
taken out of the oversight navigation until this plan is delivered.

**Owner:** peer-to-peer squad
**Written:** 3 September 2026
**Applies to:** `ideali.frontend-p2p-donation` (this repo) and `ideali.api` (the .NET modular monolith)

---

## 1. Why this is deferred rather than shipped

The screen behind the **Emails** tab is finished frontend work: eight templates, a rich-text editor
constrained to the markup the server's sanitiser keeps, a per-template on/off switch, and a "send a test"
action. What is *not* finished is the half that decides whether any of it matters — the sending itself.

Only two of the eight emails are proven to leave the building. `PageApproved` and `PageRejected` are
wired end to end and covered by `peerToPeerInvitations.api.spec.ts` and `peerToPeerModeration.ui.spec.ts`,
including the rule that a second decision on the same moderation entry sends nothing. The remaining six
are editable on screen with no evidence that anything triggers them.

Shipping the tab in that state offers a charity a switch that appears to control an email nobody has
confirmed is sent. That is worse than not offering the tab at all: it invites the charity to write copy,
turn a template on, and reasonably believe supporters are receiving it.

**Decision:** the tab is hidden. The route stays live, so the screen is reachable by address for testing
and for the work below, and nothing is deleted.

---

## 2. Scope

### In scope for the next phase

| Item | What "done" means |
|---|---|
| The six unproven templates | Each one has a named trigger in the API, a dispatch row, and an end-to-end test proving one send and exactly one |
| Idempotency | A trigger that fires twice sends once. Proven the way the decision emails already are, by a unique index |
| The on/off switch | Switching a template off provably stops the send, not only the screen state |
| Unsubscribe | One supporter opting out stops every lifecycle email to that address on that campaign, and is honoured server-side |
| Send-a-test | Test sends are rate limited and never counted as a real dispatch |
| Quiet hours / frequency | A supporter never receives more than one lifecycle email per campaign per day |
| The tab | Put back into `ModerationShell` in the same change that proves the sends |

### Out of scope

- Donation receipts and the existing campaign emails. Those are a separate system and are not touched.
- Invitations (the **Invitations** tab). Already delivered and staying where it is.
- Per-fundraiser custom copy. Templates are per campaign, as they are today.
- Scheduling a send for a chosen date. Every lifecycle email is triggered by an event, never by a clock
  the organiser sets.

---

## 3. The eight templates

`EmailTemplateType` in `src/app/interface/donationInter/peerToPeerEmailTemplateDto.ts`.

| Template | Trigger it needs | State today |
|---|---|---|
| `PageApproved` | Charity approves a page awaiting review | **Delivered and proven** |
| `PageRejected` | Charity refuses a page awaiting review | **Delivered and proven** |
| `Welcome` | A fundraising page goes live | Editable, sending unproven |
| `FirstDonation` | The first donation lands on a page | Editable, sending unproven |
| `MilestoneReached` | A page crosses a share of its goal | Editable, sending unproven. **Which shares? See open questions** |
| `QuietWeek` | A live page takes nothing for seven days | Editable, sending unproven |
| `CampaignEnding` | The campaign is near its end date | Editable, sending unproven. **How near? See open questions** |
| `ThankYou` | The campaign finishes | Editable, sending unproven |

---

## 4. Flow

### What the organiser does

```
Oversight  ->  Emails tab  ->  one card per template
                                 |
                                 |-- edit subject and body (TipTap, restricted to the sanitiser's allow-list)
                                 |-- insert placeholders offered on the screen
                                 |-- switch the template on or off
                                 |-- send a test to themselves or to an address they type
                                 '-- Save
```

Saving sends `PUT /api/donation/campaign/{id}/peer-to-peer/email-templates` with the template type,
subject, body and enabled flag. The screen never renders the stored HTML as HTML — the editor holds it —
and the server sanitises on the way in regardless of what the client sent.

### What the supporter receives

```
event on the campaign (page approved, first donation, seven quiet days, ...)
        |
        v
API decides whether this supporter is eligible
        |-- template switched off for this campaign?      -> nothing
        |-- supporter unsubscribed from this campaign?    -> nothing
        |-- already dispatched for this event?            -> nothing   (unique index, not a code check)
        |-- another lifecycle email today?                -> nothing
        v
render template with placeholder values
        |
        v
PeerToPeerEmailDispatch row written, then handed to the mail provider
```

The dispatch row is the record and the lock in one. It is written before the send is attempted, so a
retry after a crash cannot produce a second email. `PeerToPeerEmailDispatch` already exists and already
carries a `Restrict` foreign key onto the fundraising page — see the cleanup note in `CLAUDE.md` and
`PROBE_LIFECYCLE_TRAIL_SQL` in `e2e/support/fundraiserPages.ts`.

---

## 5. Execution plan

Each step lands with its own tests and is independently shippable. The tab goes back only at step 6.

### Step 1 — Confirm what the API already does (API repo, no frontend change)

Read the peer-to-peer email dispatch code and write down, per template, whether a trigger exists. This
plan assumes six are missing; that assumption is the first thing to test, not to build on. Output is a
one-page finding, not code.

### Step 2 — Triggers for `Welcome` and `FirstDonation` (API)

The two with unambiguous events. Each gets a dispatch row keyed so that the same page cannot produce two
`Welcome` emails, and an integration test that fires the event twice and asserts one row and one send.

### Step 3 — Eligibility rules, once, in one place (API)

Switch state, unsubscribe, per-day cap, and the idempotency key resolved by a single service every
trigger calls. Written before the harder triggers so they inherit it rather than each re-deciding.
Authorisation stays server-side; the on/off switch is not a client-side gate.

### Step 4 — The four judgement-call triggers (API)

`MilestoneReached`, `QuietWeek`, `CampaignEnding`, `ThankYou`. These need a scheduled sweep rather than a
request-time event, so they also need: a run record, a window so a sweep that misses a day does not send
a backlog, and a bound on how many go out per run. Each answered question from section 7 becomes a test.

### Step 5 — Frontend: say what is true on each card (this repo)

- Each card states when the email sends, from the server's own `whenItSends`, which the screen already
  reads. Nothing hardcoded on the client.
- A template whose trigger is not live yet reads as such rather than showing a switch that implies it is.
- The test-send action gets its own failure copy for a rate-limited refusal.
- Unit tests for the new states, plus the Playwright widths (320/375/768/1024/1440/1920), 44px targets and
  no horizontal page scroll.

### Step 6 — Put the tab back (this repo)

Restore the `Emails` `TabLink` in `ModerationShell.tsx`, restore the two e2e assertions listed in
section 6, and delete this document's "deferred" status. The tab returns in the same change that proves
the sends, never before.

### Step 7 — Operational proof

- End-to-end: one supporter, one campaign, every template on, a full lifecycle walked. Assert the exact
  set of emails and that no template fired twice.
- Read the dispatch rows back out of the database and reconcile them against what was asserted on screen.
- Confirm unsubscribe stops all of them and that the unsubscribe page still answers an unknown code
  without revealing whether it exists.

---

## 6. What was changed to defer it

| File | Change |
|---|---|
| `src/app/components/organizer/donation/peerToPeer/moderation/ModerationShell.tsx` | The `Emails` `TabLink` is not rendered. Everything else in the shell is untouched. |
| `src/routes/organizerRoutes.tsx` | **Unchanged.** `/donation/campaign/:campaignUniqueId/peer-to-peer/email-templates` still resolves, so the screen is reachable by address. |
| `e2e/peerToPeerInvitations.ui.spec.ts` | `Tabs_Oversight_...` now asserts the tab is absent; the pointer-cursor test uses the Invitations tab. The `Screen 11` block still opens the screen by address and is unchanged. |

No service, hook, copy file or component belonging to the emails screen was deleted or edited. Bringing
the tab back is a one-line change plus the two e2e assertions.

---

## 7. Open questions — answer before step 4

1. **Milestones.** Which shares of a goal send an email? 25/50/75/100, or only 100? A page whose goal is
   later lowered can cross the same milestone twice — is the second one sent?
2. **Quiet week.** Seven days from the last donation, or from the page going live when there has never
   been one? Does a quiet page keep receiving one every seven days, or once ever?
3. **Campaign ending.** How many days before the end date? What happens to a campaign with no end date?
4. **Thank you.** Sent to every fundraiser, or only to those who raised something?
5. **Frequency cap.** One lifecycle email per supporter per campaign per day is proposed above. Confirm,
   and decide whether the decision emails (`PageApproved`, `PageRejected`) are exempt — they are answers
   to something the supporter did and arguably must never be delayed.
6. **Test sends.** What rate limit, and do they count against the frequency cap? They must not write a
   dispatch row, or a test would suppress the real email.

---

## 8. Known gap in this document

The repository standard is that any document proposing or reporting screen work carries a screenshot of
each screen — `Before` and `After`, side by side, stored under `screenshots/` beside the document.

**This document has no screenshots.** Capturing them needs the dev server and the API running and a
Playwright run, which has not been performed. The document is therefore incomplete against that standard
and is being handed over as such rather than presented as finished. The two shots needed are the oversight
tab strip with the **Emails** tab and the same strip without it.
