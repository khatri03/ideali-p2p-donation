# CLAUDE.md — Ideali P2P Donation

Enterprise SaaS event management platform. **Frontend-only repo.** Backend is a separate .NET Core 9 modular monolith at `D:\V4Ideas\Ideali\ideali.api`.

**This is a production repository.** Everything merged here is shipped to real users. Build at production quality — see Production Quality Bar below — not at MVP or prototype quality.

---

## Agent Behaviour (Read First)

These rules govern how you work in this repo, not just how the code is structured.

**Before creating any file:**

- State what file(s) you will create and where, then wait if the intent is ambiguous.
- Never create a file outside the locations defined in Project Structure below.

**Before adding any dependency:**

- Ask. Do not `npm install` anything without explicit approval.
- Date library → `date-fns`. Calendar → `FullCalendar`. Charts → `Recharts`. Do not introduce alternatives.

**After every code change:**

- Run `npm run lint` mentally — do not produce code that would obviously fail ESLint strict mode.
- If you edit a hook, check that its query key follows `[resource, filters]` and that `onSuccess`/`onError`/`onSettled` are all handled.

**On the mock data situation:**

- `src/data/mock.ts` is temporary. Before adding any new feature, check whether a real API endpoint exists in `src/api/`. If it does, wire to it. If it doesn't, say so and ask whether to use mock data or wait.
- Do not expand `mock.ts`. Do not add new mock shapes unless explicitly told to.

**Universal UI cursor rules:**

- Every clickable item should show a pointer cursor when hovered.
- Every disabled or readonly item should show a `not-allowed` cursor when hovered.

**When in doubt about architecture:**

- Follow the decision ladder in State Management below.
- If a pattern isn't covered here, match the closest existing pattern in the codebase rather than inventing something new.

**On quality level:**

- Production repo. Every UI you build is final UI — neat, consistent, complete. MVP-grade output is a defect here.
- Read Production Quality Bar before building any screen, and apply its ship gate before reporting work complete.

**On DevOps and pipeline files:**

- Never edit `.yml` / `.yaml` files — `azure-pipelines.yml`, `buildspec.yml`, `appspec.yml`, or any CI/CD, deployment, or infrastructure manifest. They are owned by DevOps, not by this repo's feature work.
- Same for `scripts/` deployment shell scripts and `appspec.yml` hooks.
- If a change requires a pipeline edit (new env var, new Node version, new build step), **state exactly what needs changing and hand it to DevOps.** Do not make the edit yourself, not even a one-line version bump.

**What NOT to do without being asked:**

- Do not add Zustand, Redux, Jotai, or any global state library.
- Do not add `dayjs`, `moment`, or `luxon` — use `date-fns`.
- Do not use `localStorage` or `sessionStorage` for anything, especially auth tokens.
- Do not use `dangerouslySetInnerHTML`.
- Do not write snapshot tests.
- Do not add `// TODO: extend this later` scaffolding — build it now or don't build it.
- Do not ship a placeholder, stub screen, or half-styled surface as an interim step — finish it or leave it unrouted.

---

## Tech Stack

| Layer        | Tech                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Framework    | React **19.2.8** + React DOM 19.2.8 + TypeScript (strict)                                        |
| Build        | Vite                                                                                             |
| UI           | Chakra UI **v3** (API differs from v2 — `disabled` not `isDisabled`, new `ChakraProvider`, etc.) |
| Routing      | React Router DOM v7 (`Routes`/`Route` — not v5 `Switch`)                                         |
| Server state | TanStack Query v5                                                                                |
| Forms        | React Hook Form v7 + Zod v4                                                                      |
| Calendar     | FullCalendar v6                                                                                  |
| Charts       | Recharts (requires fixed-height container — wrap in `Box` with explicit `h` prop)                |
| Dates        | date-fns v4                                                                                      |
| Icons        | Lucide React                                                                                     |
| Animation    | framer-motion **v11** — Chakra peer dependency only, never imported directly in `src/`            |

### React 19 rules

`react`, `react-dom`, `@types/react`, and `@types/react-dom` are upgraded together — never one without the others. Types lagging the runtime silently type-checks React 19 code against an older React and hides real errors.

| React 19 change | What to write |
|---|---|
| Global `JSX` namespace removed | `import type { JSX } from 'react'` in any file annotating `JSX.Element` |
| `useRef` requires an initial value | `useRef<HTMLDivElement>(null)` — never bare `useRef()` |
| `useRef` returns `RefObject<T>` | Type the generic; do not cast with `as React.MutableRefObject<T>` |
| `propTypes` ignored at runtime | TS prop types are the only prop contract. Do not add `prop-types`. |
| `ReactDOM.findDOMNode` removed | Covered by the shim in `src/polyfills.ts` for transitive dependencies. Never call it from app code. |

framer-motion must stay at v11 or newer. v4 carries React 17-era types and breaks every Chakra `Collapse`/`SlideFade` usage under React 19 types.

### Node runtime — pinned

Node **20** is the runtime this project builds and deploys on. Declared in three places, which must never drift apart:

| Where | Value |
|---|---|
| `.nvmrc` | `20` — `nvm use` before any npm command |
| `package.json` `engines` | `node >=20.19.0`, `npm >=10.0.0` — the floor Vite 7 requires |
| `.npmrc` | `engine-strict=true` — a wrong Node fails the install instead of failing the build later |

`@types/node` tracks the runtime (`^20`). Never let it float ahead — types describing APIs that Node 20 does not have is how code that cannot run in production still type-checks.

Node 18 cannot build this project: Vite 7 declares `node: ^20.19.0 || >=22.12.0`.

**Known drift — do not silently "fix" it.** `azure-pipelines.yml` pins Node `18.x`, below the Vite 7 floor, and `buildspec.yml` overrides `@types/node` at build time. Pipeline files are owned outside this repo's coding scope (see below); report the mismatch, do not edit.

---

## Dev Commands

```bash
npm run dev        # localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run preview    # preview dist
```

No test runner yet. When adding tests:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom msw happy-dom
npm install -D playwright @playwright/test
```

## Routing Rule

- Browser-visible frontend routes must mirror backend routes exactly, excluding the `/api` prefix.
- Keep the same path segments and route params on the frontend when a backend route already exists.
- UI-only routes are allowed only when there is no backend route to mirror.
- Event registration UI, especially `/events/.../register` and payment-tab work, belongs in `D:\My Projects\V4Ideas\templates\ideali-events`. Do not do that work in the membership checkout.

---

## Project Structure

Feature-based. Code lives by domain, not by file type.

```
src/
├── api/                   # HTTP layer only — one file per backend module
│   ├── client.ts          # axios instance, auth interceptor, error handling
│   ├── auth.ts
│   ├── events.ts
│   └── types.ts           # raw API shapes (pre-Zod)
├── components/
│   ├── common/            # shared UI — no business logic, no API calls, no useQuery
│   └── layout/            # AppLayout, Sidebar, TopBar only
├── features/              # one folder per domain
│   ├── auth/              # components/, hooks/, pages/, schemas/, index.ts
│   ├── events/            # components/, hooks/, pages/, schemas/, index.ts
│   ├── dashboard/
│   └── calendar/
├── hooks/                 # cross-feature hooks (useDebounce, useLocalStorage)
├── lib/                   # third-party config (queryClient.ts, axios.ts, toaster.ts, auth.ts)
├── theme/index.ts
├── types/index.ts         # shared domain types — AppEvent, AuthUser, etc.
├── utils/                 # pure functions, no React imports
├── data/mock.ts           # TEMPORARY — do not expand
├── App.tsx                # router — lazy imports from features/*/pages
└── main.tsx
```

### Structure Rules

**Cross-feature imports — use public API only:**

```typescript
// ✅
import { EventCard } from "@/features/events";
// ❌
import { EventCard } from "@/features/events/components/EventCard";
```

**File type → location:**
| What | Where |
|---|---|
| Page component | `features/[domain]/pages/` |
| API function | `api/[module].ts` — never in a component or hook |
| TanStack Query hook | `features/[domain]/hooks/` |
| Zod schema | `features/[domain]/schemas/` |
| Shared UI (no biz logic) | `components/common/` |
| Cross-feature hook | `hooks/` |
| Pure utility | `utils/` |
| Third-party config | `lib/` |

**Skeleton files** co-locate with their component: `EventCard.tsx` + `EventCard.skeleton.tsx`. Accept same props, render `Skeleton` blocks mirroring the real layout.

**Every feature and `components/common` needs an `index.ts`** with explicit re-exports. Do not auto-export everything.

**Path alias:** use `@/` for `src/`. Never use `../../..` chains.

**All pages are lazy-loaded:**

```typescript
// App.tsx
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
// Wrap in <Suspense fallback={<DashboardSkeleton />}> — not a spinner, not null
```

---

## Architecture Decisions

### State Management — decision ladder (use in order)

1. `useState` — local to one component
2. Lift to parent — shared between 2–3 siblings
3. TanStack Query — anything from the server
4. `createContext` — cross-cutting feature state requiring 3+ levels of prop drilling
5. ~~Redux/Zustand~~ — not in this project

### Bad vs Good — state

```typescript
// ❌ Duplicating server state in useState
const [events, setEvents] = useState([])
useEffect(() => { fetch(...).then(setEvents) }, [])

// ✅ Server state belongs in TanStack Query
const { data: events } = useEvents(filters)
```

### API layer is thin — no logic

```typescript
// api/events.ts — fetch + Zod parse only. No React.
export async function fetchEvents(filters?: EventFilters) {
  const res = await client.get("/events", { params: filters });
  return z.array(appEventSchema).parse(res.data); // throw if invalid
}
```

### Components are dumb — no direct API calls

```
Component → Hook (TanStack Query) → api/[module].ts → axios client
```

Components never import from `src/api/` directly. Hooks never contain JSX.

### Page files compose, they don't implement

Target: page file under 60 lines. If it exceeds that, extract a component.

```tsx
// ✅ Page composes; logic lives in sub-components
export function Events() {
  return (
    <EventsProvider>
      <EventFilters />
      <EventsGrid />
      <EventFormModal />
      <EventsPagination />
    </EventsProvider>
  );
}
```

---

## Naming

| What            | Convention                | Example                   |
| --------------- | ------------------------- | ------------------------- |
| Component file  | `PascalCase.tsx`          | `EventCard.tsx`           |
| Skeleton file   | `PascalCase.skeleton.tsx` | `EventCard.skeleton.tsx`  |
| Hook file       | `camelCase.ts`            | `useEvents.ts`            |
| Schema file     | `[noun].schemas.ts`       | `event.schemas.ts`        |
| Component       | `PascalCase`              | `EventFormModal`          |
| Props interface | `[Component]Props`        | `EventCardProps`          |
| Hook            | `use` + camelCase         | `useCreateEvent`          |
| Zod variable    | `[noun]Schema`            | `eventSchema`             |
| Derived type    | `PascalCase`              | `EventFormValues`         |
| Constant        | `SCREAMING_SNAKE_CASE`    | `PAGE_SIZE`               |
| Boolean prop    | `is`/`has`/`can`          | `isLoading`, `canEdit`    |
| Event handler   | `handle[Action]`          | `handleSubmit`            |
| API fetch fn    | `fetch[Resource]`         | `fetchEvents`             |
| Converter       | `[source]To[Target]`      | `appEventToCalendarEvent` |

**No:** `Manager`, `Service`, `Helper`, `Utils` suffixes. No `data`, `info`, `temp` vars. No `I` prefix on TS interfaces. Named exports only — no default exports except `App.tsx` and page files.

---

## TypeScript Rules

- Strict mode. **No `any`.** Use `unknown` for untyped data, then narrow.
- Shared types → `src/types/index.ts`. Component-specific types → co-locate in the file.
- `interface` for object shapes, `type` for unions/intersections.
- Never write form types manually — use `z.infer<typeof schema>`.

---

## Key Patterns

### Forms

```typescript
const schema = z.object({
  title: z.string().min(1).max(100),
  startDate: z.string().datetime(),
});
type FormValues = z.infer<typeof schema>;

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```

Zod schema is the single source of truth. Never duplicate validation in the component.

### Data Fetching

```typescript
// Query
export function useEvents(filters?: EventFilters, page = 1) {
  return useQuery({
    queryKey: ["events", filters, page],
    queryFn: () => fetchEvents({ ...filters, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData, // mandatory — prevents flash on page change
  });
}

// Mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.events.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toaster.create({ type: "success", title: "Event created" });
    },
    onError: (err) =>
      toaster.create({ type: "error", title: extractApiError(err) }),
  });
}
```

Always handle `isLoading`, `isError`, `data`. Always handle `onSuccess`, `onError`.

### Loading States

Every async surface shows a skeleton — never a blank area, never a spinner alone.

```tsx
const { data, isLoading, isError } = useEvents();
if (isError) return <ErrorBanner message="Failed to load events." />;
if (isLoading) return <EventsGridSkeleton />;
return <EventsGrid events={data} />;
```

### Buttons During Async

Chakra v3 uses `disabled`, not `isDisabled`. Always pair with `loading`:

```tsx
<Button
  disabled={mutation.isPending}
  loading={mutation.isPending}
  loadingText="Saving..."
>
  Save Event
</Button>
```

### Optimistic Updates — when to use

| Scenario                           | Pattern                    |
| ---------------------------------- | -------------------------- |
| Delete from list                   | ✅ Optimistic              |
| Toggle boolean field               | ✅ Optimistic              |
| Create (needs server-generated ID) | ❌ Wait for response       |
| Multi-field form update            | ❌ Too complex to rollback |

Always call `invalidateQueries` in `onSettled`, not `onSuccess`.

### Pagination

```typescript
const [page, setPage] = useState(1);
useEffect(() => {
  setPage(1);
}, [filters]); // reset on filter change
```

Query params: `?page=1&pageSize=20`. Never invent other param names.

### Error Extraction

```typescript
// src/utils/errors.ts
export function extractApiError(err: unknown): string {
  const axiosErr = err as AxiosError<ProblemDetails>;
  return axiosErr.response?.data?.title ?? "An unexpected error occurred.";
}
```

Never show raw `error.message` from axios — it leaks implementation details.

---

## Production Quality Bar (Non-Negotiable)

**This repo ships to production. It is not a prototype, not an MVP, not a demo.** Every screen a user can reach is a finished screen. "Good enough for now" is not a state this codebase is allowed to be in.

### What production-ready means here

| Dimension | Bar |
|---|---|
| Visual polish | Consistent spacing scale, alignment, and type hierarchy on every surface. No ad-hoc pixel values. |
| Completeness | Every state designed: loading, empty, error, partial, permission-denied, success. |
| Interaction | Every action gives feedback within 100ms — disabled+`loading` button, skeleton, or toast. |
| Copy | Real, specific, user-facing wording. No `lorem ipsum`, no `Coming soon`, no placeholder labels. |
| Data | Real API wiring, or an explicit, stated decision to use `src/data/mock.ts`. Never silent fake data. |
| Accessibility | Semantic elements, labelled controls, visible focus ring, WCAG AA contrast, keyboard-operable. |

### Design consistency rules

- **Theme tokens only.** Colours, spacing, radii, shadows, and font sizes come from the theme (`src/theme/`). A raw hex code or arbitrary `px` value in a component is a defect.
- **One component per concept.** A second button/card/badge variant is added to the shared component in `components/common/`, never re-implemented locally.
- **Spacing comes from the Chakra scale** (`gap`, `p`, `m` tokens). Never `marginTop: "13px"`.
- **Alignment is deliberate.** Labels, values, and actions line up across cards and rows in the same view.
- **Density matches the surface.** Dashboards and tables run compact; forms and detail pages run roomy. Do not mix within one view.

### Every state is designed — no exceptions

```tsx
if (isError) return <ErrorBanner message="Failed to load donations." onRetry={refetch} />
if (isLoading) return <DonationsGridSkeleton />
if (!data?.length) return <EmptyState title="No donations yet" action={<CreateDonationButton />} />
return <DonationsGrid donations={data} />
```

An empty state is a designed screen with an icon, a headline, one sentence of guidance, and the primary action — not a bare "No data" string.

### Explicitly not acceptable

- Unstyled or half-styled surfaces "to be themed later".
- `console.log` / `console.warn` / `debugger` left in shipped code.
- Placeholder routes rendering `<div>TODO</div>` or an empty fragment.
- Dead links, buttons wired to nothing, or handlers that only `console.log`.
- Layout that visibly shifts after data loads — skeletons must mirror final dimensions.
- Raw error text, stack traces, or backend identifiers surfaced to the user.
- Any feature merged without its loading, empty, and error states.

### Ship gate

A change is production-ready only when: `npm run build` and `npm run lint` are clean with zero new warnings; the responsive checklist below passes; every async surface has skeleton + empty + error; all copy is final; no debug output remains; and tests cover the change including its failure paths. If any of these is unmet, report the change as **unfinished and state which gate failed** — never as done.

---

## Responsive Design (Non-Negotiable)

Enterprise SaaS must work on all viewports. Responsive design is **mandatory on every component and every page** — not a post-feature polish step.

### Breakpoints (Chakra UI v3)

| Token  | Width  | Target                      |
| ------ | ------ | --------------------------- |
| `base` | 0px    | Mobile — design starts here |
| `sm`   | 480px  | Large mobile                |
| `md`   | 768px  | Tablet                      |
| `lg`   | 992px  | Desktop                     |
| `xl`   | 1280px | Large desktop               |
| `2xl`  | 1536px | Wide screen                 |

**Mobile-first. Always.** `base` value targets mobile. Override upward. Never write desktop layout as default then patch mobile.

### Responsive Syntax

```tsx
// ✅ Mobile-first responsive props
<Box fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8, lg: 12 }} />

// ✅ Responsive grid
<SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={6} />

// ✅ Responsive stack
<Stack direction={{ base: "column", md: "row" }} gap={4} />

// ❌ Fixed pixel width — never
<Box width="1200px" />

// ❌ Desktop layout without mobile override — never
<Grid templateColumns="repeat(4, 1fr)" />
```

### Mandatory Rules by Surface

**Page layout:**

- All pages use `maxW` + `mx="auto"` container. Never full-bleed without explicit design intent.
- Sidebar: `display={{ base: "none", lg: "flex" }}`. Mobile gets hamburger + `Drawer`.

**Grids and lists:**

- Always `SimpleGrid` with responsive `columns`. Never hardcoded `Flex` with fixed widths.
- `columns={{ base: 1, md: 2, xl: 3 }}` minimum pattern for card grids.

**Typography:**

- Headings: `fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}`.
- Body: `fontSize={{ base: "sm", md: "md" }}`. Never hardcode a single size for text that appears on all viewports.

**Data tables:**

- Always wrap in `TableContainer` with `overflowX="auto"`. Never clip or truncate silently on mobile.
- At `base`, consider card-list layout if table has 5+ columns.

**Forms:**

- Full width at `base`. Two-column `SimpleGrid` allowed at `md+` only.
- Submit/primary CTA button: `w={{ base: "full", md: "auto" }}`.

**Modals:**

- `size={{ base: "full", md: "lg" }}`. Full screen on mobile — no tiny modals on small viewports.

**Charts (Recharts):**

- Container `Box` must have `w="100%"` and an explicit `h` prop. Recharts respects container width — never set a fixed `width` prop on the chart component.

**Touch targets:**

- All interactive elements minimum 44×44px. Use `minH="11"` (44px) on buttons/links where Chakra default is smaller.

### Anti-Patterns — Hard Prohibited

```tsx
// ❌ Fixed viewport-breaking width
<Box w="800px" />

// ❌ Overflow hidden masking broken layout
<Box overflow="hidden" w="100%" />

// ❌ vh units without dvh fallback (mobile browser chrome cuts viewport)
<Box h="100vh" />  // use minH="100dvh" or handle mobile chrome

// ❌ Hover as sole interaction signal — mobile has no hover
```

### Definition of Done — Responsive Checklist

Before marking any feature/component complete, verify all three:

- [ ] 375px (iPhone SE): no overflow, no truncation, layout intact
- [ ] 768px (tablet): two-column layouts appear, sidebar state correct
- [ ] 1280px (desktop): full layout, no stretched/distorted elements
- [ ] Tables have `overflowX="auto"` — confirmed in code
- [ ] Modals use `size={{ base: "full", md: "lg" }}`
- [ ] No horizontal page scroll at any breakpoint

**An AI agent that ships a component without responsive props on layout elements has produced incomplete code.** Apply the checklist, not just the happy path.

---

## Authentication

Access token → **in-memory only** (`src/lib/auth.ts`). Never localStorage. Refresh token → httpOnly cookie.

```typescript
let _accessToken: string | null = null;
export const auth = {
  setToken: (token: string) => {
    _accessToken = token;
  },
  getToken: () => _accessToken,
  clear: () => {
    _accessToken = null;
  },
  isAuthenticated: () => _accessToken !== null,
};
```

On login: `auth.setToken(data.accessToken)` → navigate to `/dashboard`.
On logout: `auth.clear()` → navigate to `/auth/login`.
On 401: interceptor in `api/client.ts` attempts silent refresh via httpOnly cookie, then redirects to login on failure.

Route guard lives in `AppLayout.tsx`. Auth pages (`/auth/*`) are outside `AppLayout`.

---

## Event Domain

Core types (`src/types/index.ts`):

- `AppEvent` — main entity. `id` is UUID string.
- `EventStatus`: `draft | published | ongoing | completed | cancelled`
- `EventCategory`: `conference | workshop | seminar | concert | sports | networking | webinar | hackathon | other`
- `AuthUser` — `id`, `name`, `email`, `role`

Status machine (enforce in UI — do not allow invalid transitions):

```
draft → published → ongoing → completed
              ↘ cancelled (from draft or published only)
```

FullCalendar event objects are not `AppEvent`. Always map via `appEventToCalendarEvent` before passing to FullCalendar.

---

## Engineering Principles (Quick Reference)

These are enforced, not optional.

| Principle             | Rule                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Single Responsibility | One component/hook/util, one job. `useEvents` fetches. `EventCard` renders.                              |
| DRY                   | Status labels → one map constant. Form validation → Zod only. Error extraction → `extractApiError` only. |
| KISS                  | Obvious over clever. Extract only at the third callsite. No premature abstraction.                       |
| YAGNI                 | No plugin systems for one use case. No scaffolding for hypothetical requirements.                        |
| Immutability          | Return new objects. Never mutate in place.                                                               |
| Fail Fast             | Zod parse at API boundary. If response doesn't match schema, throw — don't pass bad data to UI.          |
| Composition           | Hooks provide behaviour, components compose UI. No class inheritance for domain logic.                   |
| Lean Components       | ~150 lines max. If it fetches AND renders AND manages local state → split it.                            |

**Bad hook — violates SRP:**

```typescript
// ❌ Fetches + transforms + has side effect
export function useEvents() {
  const result = useQuery(...)
  const sorted = result.data?.sort(byDate)          // transform belongs in component
  localStorage.setItem("last-fetch", Date.now())     // side effect belongs nowhere near here
  return sorted
}
```

**Bad component — violates ISP:**

```tsx
// ❌ Receives full entity when it only needs one field
function EventBadge({ event }: { event: AppEvent }) {
  return <Badge>{event.status}</Badge>;
}
// ✅
function EventBadge({ status }: { status: EventStatus }) {
  return <Badge>{status}</Badge>;
}
```

---

## Security

- JWT access token → memory only. Never localStorage/sessionStorage.
- All Chakra components auto-escape. Never use `dangerouslySetInnerHTML`.
- All API responses → Zod parse before use. Treat responses as untrusted.
- Currency/price values → treat as strings from API. Display with `Intl.NumberFormat`. Never float arithmetic on money.

---

## Testing (When Configured)

**Frontend:** Vitest + React Testing Library + MSW for network interception.

Test: Zod schemas, pure utils, hooks via `renderHook`, component behaviour via `userEvent`.
Do not test: implementation details, Chakra internals, snapshot tests.

**Backend (.NET):** xUnit + FluentAssertions + Moq (unit) + Testcontainers (integration).

Test naming: `[Scenario]_[Condition]_[ExpectedResult]` — e.g., `Publish_DraftEvent_ChangesStatusToPublished`.

---

## Backend Contract

- REST API. Base URL via `VITE_API_BASE_URL` env var.
- Auth: JWT bearer + httpOnly refresh cookie.
- Error shape (RFC 7807):

```json
{
  "title": "Validation failed",
  "status": 400,
  "errors": { "field": ["message"] }
}
```

- Pagination params: `?page=1&pageSize=20`. Response: `{ items, total, page, pageSize, totalPages }`.
