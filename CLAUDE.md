# CLAUDE.md — Ideali P2P Donation

Enterprise SaaS event, membership and donation platform. **Frontend-only repo.** Backend is a separate .NET Core 9 modular monolith at `D:\V4Ideas\Ideali\ideali.api`.

**This is a production repository.** Everything merged here is shipped to real users. Build at production quality — see Production Quality Bar below — not at MVP or prototype quality.

**This document describes the repo as it actually is.** Where the current code falls short of the standard, that gap is named explicitly under Known Debt rather than described as if already fixed. Do not write guidance here for a stack this repo does not have.

---

## Agent Behaviour (Read First)

These rules govern how you work in this repo, not just how the code is structured.

**Before creating any file:**

- State what file(s) you will create and where, then wait if the intent is ambiguous.
- Never create a file outside the locations defined in Project Structure below.

**Before adding any dependency:**

- Ask. Do not `npm install` anything without explicit approval.
- The dependency list is already large. Prefer a library the repo already carries over a new one: dates → `Intl` / native `Date` (no date library is installed), calendar → FullCalendar, charts → Recharts (new work) or the already-present ApexCharts / Chart.js (existing screens), tables → `@tanstack/react-table`, rich text → TipTap, HTTP → axios via `HttpClient`.
- **Do not migrate the stack as a side effect of feature work.** Chakra v2 stays v2, React Router stays v6, Redux Toolkit stays. Version upgrades are their own approved change, never bundled into a feature.

**After every code change:**

- Run `npm run build` — it type-checks (`tsc`) and builds. It must be clean.
- Run `npm run test`. Every affected suite must pass, and the change must arrive with tests of its own — success paths and failure paths both.
- Run `npm run test:e2e` when the change touches a screen, an endpoint or a database constraint. Verify the result yourself against the running application; do not hand the user a manual checklist in place of a test.
- There is **no ESLint config and no `lint` script** in this repo. Do not reference `npm run lint` as if it works, and do not add a linter without approval.

**Before any commit — absolute, no exceptions:**

- Tests are written, tests are run, tests are green. A commit without a test run is not permitted, whatever the deadline, however small the change.
- "Tests to follow", "trivial change", "docs only", "hotfix" are **not** exemptions. Documentation-only commits still run the suite to prove nothing else drifted.
- If the runner is missing or broken, that is the blocker to fix first. Do not commit around it.
- Never bypass a hook with `--no-verify` to escape this rule.

**Universal UI cursor rules:**

- Every clickable item shows a pointer cursor when hovered.
- Every disabled or readonly item shows a `not-allowed` cursor when hovered.

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

- Do not add another global state library. Redux Toolkit is already here; do not add Zustand, Jotai, or Recoil alongside it.
- Do not add `dayjs`, `moment`, or `luxon`. Format dates with `Intl.DateTimeFormat` / `toLocaleDateString`, matching existing screens.
- Do not add a data-fetching library (TanStack Query, SWR). Server calls go through `src/app/service/**` — see Data Fetching.
- Do not use `dangerouslySetInnerHTML`.
- Do not write snapshot tests.
- Do not add `// TODO: extend this later` scaffolding — build it now or don't build it.
- Do not ship a placeholder, stub screen, or half-styled surface as an interim step — finish it or leave it unrouted.
- Do not add new `console.log` — see Known Debt.

---

## Tech Stack

Versions below are what `package.json` actually declares. Keep this table in sync when a version changes.

| Layer          | Tech                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| Framework      | React **19.2.8** + React DOM 19.2.8                                               |
| Language       | TypeScript **4.9.5** — `strict: true` but **`strictNullChecks: false`**           |
| Build          | Vite **7**, `@vitejs/plugin-react`, `vite-plugin-svgr`, `vite-tsconfig-paths`     |
| UI             | Chakra UI **v2.10.9** + `@chakra-ui/icons` — v2 API (`isDisabled`, `isLoading`)   |
| Routing        | React Router DOM **v6.4.0** (`Routes`/`Route`, `useNavigate`)                     |
| Global state   | Redux Toolkit **v2** + `react-redux` v9 — `src/store`                             |
| Server state   | axios **v1** through `src/app/service/httpClient/HttpClient.ts`                   |
| Realtime       | `@microsoft/signalr`                                                              |
| Payments       | Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`)                           |
| Auth (social)  | `@react-oauth/google`, `jwt-decode`                                               |
| Calendar       | FullCalendar v6, `react-calendar`                                                 |
| Charts         | Recharts v3, ApexCharts v3 + `react-apexcharts`, Chart.js v4 + `react-chartjs-2`  |
| Tables         | `@tanstack/react-table` v8                                                        |
| Rich text      | TipTap v3 (`@tiptap/react`, `starter-kit`, extensions)                            |
| Drag & drop    | `@dnd-kit/core` + `sortable` + `modifiers`                                        |
| Export         | `jspdf` + `jspdf-autotable`, `xlsx` / `xlsx-js-style`, `react-to-print`           |
| Maps           | `mapbox-gl`, `react-map-gl`                                                       |
| Icons          | `react-icons` (dominant), `lucide-react`                                          |
| Dates          | **No date library.** Native `Date` + `Intl` / `toLocaleDateString`                |
| Animation      | framer-motion **v11** — Chakra peer dependency only, never imported directly      |
| Analytics      | `react-ga4`, `web-vitals`                                                         |
| Testing        | Vitest **3** + happy-dom, Testing Library (react v16, user-event v14, jest-dom v6), MSW v2 |
| End-to-end     | Playwright **1.62** — `e2e/`, chromium, desktop + 375px projects                   |

**Not in this project** — do not write code, docs, or reviews that assume them: Chakra v3, React Router v7, TanStack **Query**, React Hook Form, Zod, date-fns, Zustand.

### Chakra v2 API — the differences that bite

| Concern            | Chakra v2 (this repo)                             |
| ------------------ | ------------------------------------------------- |
| Disabled control   | `isDisabled` (**not** `disabled`)                 |
| Loading button     | `isLoading` + `loadingText` (**not** `loading`)   |
| Provider           | `<ChakraProvider theme={theme}>`                  |
| Theme creation     | `extendTheme` from `@chakra-ui/react`             |
| Modal              | `Modal` / `ModalOverlay` / `ModalContent`         |
| Open state         | `useDisclosure()` → `isOpen`, `onOpen`, `onClose` |

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

**Known drift — do not silently "fix" it.** `azure-pipelines.yml` pins Node `18.x`, below the Vite 7 floor, and `buildspec.yml` overrides `@types/node` at build time. Pipeline files are owned outside this repo's coding scope; report the mismatch, do not edit.

---

## Dev Commands

```bash
npm run dev        # vite dev server — localhost:3000, /api proxied to api.testing.ideali.io
npm run build      # tsc && vite build
npm run preview    # preview dist
npm run test       # vitest run — required before every commit
npm run test:e2e   # tsc -p tsconfig.e2e.json && playwright test — required before every phase is called done
```

`npm run start` is an alias of `dev`. There is **no `lint` script.**

`npm run test` is the commit gate. `npm run test:watch` and `npm run test:coverage` are also available. See Testing.

`npm run test:e2e` is the phase gate and needs the dev server and the API both running. See
End-to-End Verification.

### Dev server over HTTPS (required)

The dev server always serves HTTPS. `vite.config.ts` reads the certificate at config load, so a missing pair fails `npm run dev` immediately rather than degrading to HTTP.

Certificates are machine-local and gitignored. Generate them once per machine with the globally installed `mkcert` CLI:

```bash
mkcert -install
mkcert -cert-file ssl/cert.pem -key-file ssl/key.pem localhost 127.0.0.1 ::1
```

The IP SANs matter — `DNS:localhost` alone does not cover `https://127.0.0.1`.

To use a pair kept outside the repository, set **both** env vars; setting only one throws at config load:

```bash
DEV_HTTPS_KEY=/path/to/localhost-key.pem
DEV_HTTPS_CERT=/path/to/localhost.pem
```

Names are deliberately not `VITE_`-prefixed so cert paths never reach the client bundle.

---

## Routing Rule

- Browser-visible frontend routes must mirror backend routes exactly, excluding the `/api` prefix.
- Keep the same path segments and route params on the frontend when a backend route already exists.
- UI-only routes are allowed only when there is no backend route to mirror.
- Event registration UI, especially `/events/.../register` and payment-tab work, belongs in `D:\My Projects\V4Ideas\templates\ideali-events`. Do not do that work in the membership checkout.

Route tables live in `src/routes/` — one file per role (`adminRoutes.tsx`, `organizerRoutes.tsx`, `memberRoutes.tsx`). Top-level routes and layout selection live in `src/App.tsx`.

---

## Project Structure

Role- and domain-based. `src/app` holds the P2P donation product; `src/views`, `src/layouts`, `src/themeComponents` are the Horizon UI template foundation the product was built on.

```
src/
├── app/                        # product code
│   ├── components/
│   │   ├── admin/              # admin-role screens and widgets
│   │   ├── auth/               # sign-in, sign-up, forgot/reset password
│   │   ├── common/             # shared UI — no service calls
│   │   ├── member/             # member-role screens
│   │   └── organizer/          # organizer-role screens (donation, membership, settings)
│   ├── interface/              # TypeScript request/response contracts, one folder per domain
│   ├── service/                # HTTP layer
│   │   ├── httpClient/HttpClient.ts   # axios instance, auth + refresh interceptors
│   │   ├── admin/  auth/  organizer/  # one file per backend area
│   │   └── helpers/
│   └── utils/
├── assets/                     # images, css
├── contexts/SidebarContext.js
├── layouts/                    # admin / auth / rtl shells
├── routes/                     # adminRoutes, organizerRoutes, memberRoutes
├── store/                      # Redux Toolkit — index.ts, hooks.ts, slices/
├── theme/                      # Chakra theme — theme.tsx, foundations/, components/
├── themeComponents/            # Horizon UI template components (card, navbar, sidebar, menu)
├── types/                      # ambient .d.ts only
├── utils/                      # auth, permissions, role redirect, sidebar factory
├── variables/
├── views/                      # Horizon UI template pages (admin, auth)
├── App.tsx                     # router + providers
├── index.tsx                   # entry
└── polyfills.ts                # findDOMNode shim for transitive deps

e2e/                            # Playwright — see End-to-End Verification
├── *.ui.spec.ts                # browser journeys, run at desktop and 375px
├── *.api.spec.ts               # endpoint contract and authorisation
├── *.database.spec.ts          # schema constraints
├── auth.setup.ts               # signs in once, shares the session
└── support/                    # environment, SQL access, campaign fixtures

docs/                           # plan of record — p2p-build-plan.html
```

### Structure Rules

**File type → location:**

| What                              | Where                                    |
| --------------------------------- | ---------------------------------------- |
| Role screen / page                | `app/components/[role]/`                 |
| Shared UI with no business logic  | `app/components/common/`                 |
| HTTP call                         | `app/service/[area]/[name]Service.ts`    |
| Request/response type             | `app/interface/[domain]Inter/`           |
| Redux slice                       | `store/slices/`                          |
| Cross-cutting pure helper         | `utils/` (app-wide) or `app/utils/`      |
| Chakra theme override             | `theme/components/`                      |

**Imports:** `baseUrl` is `src`, so import from the src root — `import HttpClient from 'app/service/httpClient/HttpClient'`. The only path alias is `@assets/*`. There is no `@/` alias. Never write `../../..` chains, and never write `'../src/...'` from inside `src`.

**Exports:** screens and services in this repo use `export default`; shared components in `app/components/common/` use named exports. Match the convention of the folder you are editing rather than converting files as a drive-by.

**Route-level code splitting:** route tables lazy-load their screens (`lazy(() => import(...))`) and render under a `Suspense` fallback — use `SuspenseLoader`, not `null`. New routes follow the same pattern.

---

## Architecture Decisions

### State Management — decision ladder (use in order)

1. `useState` — local to one component
2. Lift to parent — shared between 2–3 siblings
3. `createContext` — cross-cutting feature state requiring 3+ levels of prop drilling
4. Redux Toolkit slice in `src/store/slices/` — state genuinely shared across roles or routes (current slices: `donation`, `profile`)
5. Server data — fetch through a service, hold in local state or a slice. Do not invent a caching layer.

Access the store only via the typed hooks in `src/store/hooks.ts`. Never `useSelector` / `useDispatch` untyped.

### Service layer is thin — no React, no JSX

```typescript
// app/service/organizer/donationService.ts
import HttpClient from 'app/service/httpClient/HttpClient';
import { DonationDto, DonationQuery } from 'app/interface/donationInter/donationDto';

export const getDonations = async (params: DonationQuery): Promise<DonationDto[]> => {
  const { data } = await HttpClient.get('/api/donation', { params });
  return data;
};
```

- Every request goes through `HttpClient` so the auth header, refresh-on-401 and `withCredentials` behaviour apply. A bare `axios.get` in a component is a defect.
- Base URL comes from `VITE_API_BASE_URL`. Never hardcode a host.
- Services return typed data from `app/interface`. `any` on a service boundary is a defect in new code.

### Components call services through a hook or an effect, never inline in JSX

```
Component → local hook / effect → app/service/[area] → HttpClient
```

### Page files compose, they don't implement

Target: page component under ~150 lines. If it fetches **and** renders **and** manages complex local state, split it.

---

## Naming

| What            | Convention                                   | Example                      |
| --------------- | -------------------------------------------- | ---------------------------- |
| Component file  | `PascalCase.tsx`                             | `MemberRegistrationPage.tsx` |
| Service file    | `camelCaseService.ts`                        | `donationService.ts`         |
| Interface file  | `camelCase.ts` in `interface/[domain]Inter/` | `donationDto.ts`             |
| Redux slice     | `[noun]Slice.ts`                             | `donationSlice.ts`           |
| Component       | `PascalCase`                                 | `CreateDonationPage`         |
| Props interface | `[Component]Props`                           | `StatusBadgeProps`           |
| Hook            | `use` + camelCase                            | `useAppSelector`             |
| Constant        | `SCREAMING_SNAKE_CASE`                       | `PAGE_SIZE`                  |
| Boolean prop    | `is`/`has`/`can`                             | `isLoading`, `canEdit`       |
| Event handler   | `handle[Action]`                             | `handleSubmit`               |
| Service fn      | `get/create/update/delete[Resource]`         | `getDonations`               |

**No:** `Manager`, `Helper`, `Utils` suffixes on new files. No `data`, `info`, `temp` variable names. No `I` prefix on TS interfaces.

---

## TypeScript Rules

- `strict: true`, but **`strictNullChecks` is off** repo-wide. That means the compiler will *not* catch a missing null guard — write the guard yourself. Do not treat a green `tsc` as proof a value is non-null.
- **No new `any`.** Use `unknown` and narrow, or declare the shape in `app/interface`. Existing `any` usage is debt, not a licence.
- `interface` for object shapes, `type` for unions/intersections.
- Ambient declarations belong in `src/types/*.d.ts` (`typeRoots` includes it). Domain types belong in `app/interface`.

---

## Key Patterns

### Forms

No form library is installed. Forms are controlled React state plus explicit validation, with shared validators in `app/components/common/validation.tsx`.

```tsx
const [values, setValues] = useState<MemberForm>(EMPTY_MEMBER_FORM);
const [errors, setErrors] = useState<Partial<Record<keyof MemberForm, string>>>({});

const handleSubmit = async () => {
  const validationErrors = validateMemberForm(values);
  setErrors(validationErrors);
  if (Object.keys(validationErrors).length) return;
  await createMember(values);
};
```

- Validation rules live in one place per form and are reused by every caller — never inline the same regex twice.
- Every invalid field renders `FormControl` + `isInvalid` + `FormErrorMessage`. A silent rejected submit is a defect.

### Data Fetching

```tsx
const [donations, setDonations] = useState<DonationDto[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let isActive = true;
  setIsLoading(true);
  getDonations(filters)
    .then((result) => { if (isActive) { setDonations(result); setError(null); } })
    .catch((err) => { if (isActive) setError(extractApiError(err)); })
    .finally(() => { if (isActive) setIsLoading(false); });
  return () => { isActive = false; };
}, [filters]);
```

- Always the full triple: `isLoading`, `error`, `data`. A fetch with no error branch is a defect.
- Always guard against setting state after unmount.
- After a mutation, refetch the list explicitly — there is no cache to invalidate.

### Loading States

Every async surface shows a skeleton — never a blank area, never a bare spinner.

```tsx
if (error) return <ErrorBanner message={error} onRetry={refetch} />;
if (isLoading) return <DonationsGridSkeleton />;
if (!donations.length) return <EmptyState title="No donations yet" action={<CreateDonationButton />} />;
return <DonationsGrid donations={donations} />;
```

### Buttons During Async (Chakra v2)

```tsx
<Button isDisabled={isSaving} isLoading={isSaving} loadingText="Saving...">
  Save Donation
</Button>
```

### Pagination

```typescript
const [page, setPage] = useState(1);
useEffect(() => { setPage(1); }, [filters]); // reset on filter change
```

Query params: `?page=1&pageSize=20`. Never invent other param names.

### Error Extraction

```typescript
export function extractApiError(err: unknown): string {
  const axiosErr = err as AxiosError<ProblemDetails>;
  return axiosErr.response?.data?.title ?? 'An unexpected error occurred.';
}
```

Never show raw `error.message` from axios — it leaks implementation details.

### Money

Currency values are treated as strings from the API and displayed with `Intl.NumberFormat`. Never do float arithmetic on money.

---

## Production Quality Bar (Non-Negotiable)

**This repo ships to production. It is not a prototype, not an MVP, not a demo.** Every screen a user can reach is a finished screen.

### What production-ready means here

| Dimension     | Bar |
|---------------|-----|
| Visual polish | Consistent spacing scale, alignment, and type hierarchy on every surface. No ad-hoc pixel values. |
| Completeness  | Every state designed: loading, empty, error, partial, permission-denied, success. |
| Interaction   | Every action gives feedback within 100ms — `isDisabled`+`isLoading` button, skeleton, or toast. |
| Copy          | Real, specific, user-facing wording. No `lorem ipsum`, no `Coming soon`, no placeholder labels. |
| Data          | Real API wiring. Never silent fake data. |
| Accessibility | Semantic elements, labelled controls, visible focus ring, WCAG AA contrast, keyboard-operable. |

### Design consistency rules

- **Theme tokens only.** Colours, spacing, radii, shadows, and font sizes come from `src/theme/`. A raw hex code or arbitrary `px` value in a component is a defect.
- **One component per concept.** A second button/card/badge variant is added to the shared component in `app/components/common/`, never re-implemented locally.
- **Spacing comes from the Chakra scale** (`gap`, `p`, `m` tokens). Never `marginTop: "13px"`.
- **Alignment is deliberate.** Labels, values, and actions line up across cards and rows in the same view.
- **Density matches the surface.** Dashboards and tables run compact; forms and detail pages run roomy. Do not mix within one view.

An empty state is a designed screen with an icon, a headline, one sentence of guidance, and the primary action — not a bare "No data" string.

### Explicitly not acceptable

- Unstyled or half-styled surfaces "to be themed later".
- `console.log` / `console.warn` / `debugger` in new code.
- Placeholder routes rendering `<div>TODO</div>` or an empty fragment.
- Dead links, buttons wired to nothing, or handlers that only log.
- Layout that visibly shifts after data loads — skeletons must mirror final dimensions.
- Raw error text, stack traces, or backend identifiers surfaced to the user.
- Any feature merged without its loading, empty, and error states.

### Ship gate

A change is production-ready only when: `npm run build` is clean with zero new warnings; **`npm run test` has been run and every affected suite is green, with new tests covering this change including its failure paths**; the responsive checklist below passes; every async surface has skeleton + empty + error; all copy is final; no debug output remains; and no secret was added. If any gate is unmet, report the change as **unfinished and state which gate failed** — never as done. The test gate is not waivable: an unrunnable suite blocks the commit until the runner works.

---

## Responsive Design (Non-Negotiable)

### Breakpoints — project-defined, not Chakra defaults

`src/theme/foundations/breakpoints.ts` overrides the Chakra scale. Use these values:

| Token  | Width  | Target                      |
| ------ | ------ | --------------------------- |
| `base` | 0px    | Mobile — design starts here |
| `sm`   | 320px  | Small mobile                |
| `2sm`  | 380px  | Large mobile                |
| `md`   | 768px  | Tablet                      |
| `lg`   | 960px  | Desktop                     |
| `xl`   | 1200px | Large desktop               |
| `2xl`  | 1600px | Wide screen                 |
| `3xl`  | 1920px | Full HD                     |

`sm` is 320px here, **not** Chakra's default 480px, and `lg` is 960px, not 992px. Guidance written against Chakra defaults will break layouts in this repo.

**Mobile-first. Always.** `base` targets mobile. Override upward. Never write desktop layout as default then patch mobile.

### Responsive Syntax

```tsx
<Box fontSize={{ base: 'sm', md: 'md' }} px={{ base: 4, md: 8, lg: 12 }} />
<SimpleGrid columns={{ base: 1, '2sm': 2, lg: 3, xl: 4 }} gap={6} />
<Stack direction={{ base: 'column', md: 'row' }} gap={4} />

// ❌ Fixed pixel width — never
<Box width="1200px" />
// ❌ Desktop layout without mobile override — never
<Grid templateColumns="repeat(4, 1fr)" />
```

### Mandatory Rules by Surface

**Page layout:** `maxW` + `mx="auto"` container. Sidebar `display={{ base: 'none', lg: 'flex' }}`; mobile gets hamburger + `Drawer`.

**Grids and lists:** `SimpleGrid` with responsive `columns` — `{ base: 1, md: 2, xl: 3 }` minimum for card grids. Never fixed-width `Flex`.

**Typography:** headings `fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}`; body `{ base: 'sm', md: 'md' }`.

**Data tables:** wrap in `TableContainer` with `overflowX="auto"`. Never clip or truncate silently. At `base`, consider a card list when the table has 5+ columns.

**Forms:** full width at `base`. Two-column `SimpleGrid` at `md+` only. Primary CTA `w={{ base: 'full', md: 'auto' }}`.

**Modals (Chakra v2):** `size={{ base: 'full', md: 'lg' }}`. Full screen on mobile.

**Charts:** container `Box` needs `w="100%"` and an explicit `h`. Never set a fixed `width` on the chart component itself.

**Touch targets:** minimum 44×44px on every interactive element.

### Anti-Patterns — Hard Prohibited

```tsx
<Box w="800px" />                  // ❌ fixed viewport-breaking width
<Box overflow="hidden" w="100%" /> // ❌ hiding broken layout
<Box h="100vh" />                  // ❌ use minH="100dvh" — mobile chrome cuts vh
// ❌ hover as the sole interaction signal — mobile has no hover
```

### Definition of Done — Responsive Checklist

- [ ] 375px (iPhone SE): no overflow, no truncation, layout intact
- [ ] 768px (tablet): two-column layouts appear, sidebar state correct
- [ ] 1280px (desktop): full layout, no stretched/distorted elements
- [ ] Tables have `overflowX="auto"` — confirmed in code
- [ ] Modals use `size={{ base: 'full', md: 'lg' }}`
- [ ] No horizontal page scroll at any breakpoint

**A component shipped without responsive props on its layout elements is incomplete code.**

---

## Authentication — as currently implemented

`src/utils/auth.ts` and `HttpClient.ts` are the whole auth surface.

- Access token, refresh token and user object are stored in **`localStorage`** under `AuthToken`, `RefreshToken`, `user`.
- `HttpClient` attaches the bearer token, sends `withCredentials: true`, and on 401 calls `/api/identity/account/refresh-token` with the stored refresh token, queueing concurrent failures until the refresh resolves.
- Logout clears those three keys and redirects to `/auth/sign-in/custom`.
- Roles drive routing: `src/utils/roleRedirect.ts`, `src/utils/allowedModules.ts`, `PermissionGate`, and the three role route tables.

**This is known security debt, not the target design.** Tokens in `localStorage` are readable by any script on the page, so any XSS becomes full account takeover. The target is an in-memory access token plus an httpOnly refresh cookie. Do not extend the `localStorage` pattern to new token-like values, and do not describe the current behaviour as correct. Changing it is a coordinated frontend + backend change and needs explicit approval.

**Client-side role checks are presentation only.** `PermissionGate` hides UI; it does not authorise anything. Every privileged action must be authorised server-side.

---

## Domain

Roles: **admin**, **organizer**, **member**. Each has its own route table, layout and component tree.

Main areas under `app/components/organizer/`: donation campaigns (create, donate, public campaign list, invoices), membership (create, member registration, custom forms, invoices), settings and integrations.

Contracts live in `app/interface/` — `donationInter`, `memberInter`, `membershipInter`, `organizerInter`, `paymentMethod`, `paymentMerchantsInter`, `moduleInter`, `ResponseDto`, `CommonInter`.

FullCalendar event objects are not domain entities — map explicitly before passing them in.

---

## Engineering Principles (Quick Reference)

| Principle             | Rule                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Single Responsibility | One component/hook/service, one job.                                                     |
| DRY                   | Status labels → one map constant. Validation → one validator. Errors → `extractApiError`. |
| KISS                  | Obvious over clever. Extract at the second repeat, not the fourth.                       |
| YAGNI                 | No plugin systems for one use case. No scaffolding for hypothetical needs.                |
| Immutability          | Return new objects. Never mutate state in place (RTK's Immer draft excepted).             |
| Fail Fast             | Validate at the boundary. Bad response shape → surface an error, don't render it.         |
| Composition           | Hooks provide behaviour, components compose UI.                                           |
| Lean Components       | ~150 lines. Fetches AND renders AND manages state → split.                               |

---

## Security

- **All API responses are untrusted.** Type assertions are not validation — guard before you index.
- Chakra escapes by default. Never use `dangerouslySetInnerHTML`. TipTap output must be sanitised before it is ever rendered as HTML.
- No secret in any committed file. `VITE_*` env vars are **public** — they ship in the client bundle. Never put a private key, API secret, or anything server-side behind a `VITE_` name.
- Authorisation is server-side on every endpoint, deny by default.
- Errors shown to users carry no stack trace, no internal identifier, no framework detail.
- Token storage: see Authentication above — the current `localStorage` approach is tracked debt.

---

## Testing

**Tests are a commit gate, not a phase.** No check-in, no commit, no push without the suite written and run green. There is no exception for size, urgency, or change type.

Runner: **Vitest 3** on **happy-dom**, configured in `vitest.config.ts` — deliberately standalone rather than merged with `vite.config.ts`, which reads the local HTTPS certificate pair at load time and must not be a precondition for running tests. Global setup lives in `src/setupTests.ts` (jest-dom matchers, `cleanup` after each test, `matchMedia`/`scrollTo` stubs Chakra needs). Coverage is `@vitest/coverage-v8`. MSW is installed for future network-level fakes; service tests currently mock `HttpClient` directly.

`@testing-library/react` is **v16**, `user-event` **v14**, `jest-dom` **v6**, with `@testing-library/dom` v10 installed explicitly as v16 requires it as a peer. The React 17-era v11/v12/v5 versions this repo used to carry cannot render React 19 — never downgrade them.

Test: pure utils, validators, services with mocked HTTP, and component behaviour via `userEvent`. Do not test implementation details. Do not write snapshot tests.

Every change lands with its tests in the same commit:

- Behaviour a caller depends on, never private internals.
- The specific outcome asserted, not merely truthy.
- One reason to fail per test; shared setup in a factory, not copy-paste.
- Failure paths covered as thoroughly as success paths — bad input, expired auth, malformed payload, missing permission.
- No sleeps, no ordering dependencies, no shared mutable state.

If a suite fails, quote the failing output and report the change as **unfinished**. Never round a red suite up to done.

This repo's gate is zero failures — there is no baseline of known-red frontend tests, and none is to be created. The backend repo carries five tests that were already red before the peer-to-peer work; they are recorded in `tests/Ideas.API.Tests/KNOWN_FAILURES.md` there and its gate is "no new failures against that list". That list may shrink, never grow.

Test naming: `[Scenario]_[Condition]_[ExpectedResult]` — e.g. `Donate_AmountBelowMinimum_ShowsValidationError`.

---

## End-to-End Verification (Mandatory)

Vitest proves a component behaves in isolation. It cannot prove the screen renders against the real
API, that the endpoint refuses the wrong caller, or that a database constraint holds. **Playwright is
the gate for those, and it is not optional.** No phase, feature or fix is reported complete until its
end-to-end coverage exists and passes.

### Running it

```bash
npm run test:e2e          # type-checks e2e, then runs every project
npm run test:e2e:ui       # interactive runner
npm run test:e2e:report   # last HTML report
```

Both servers must be up first: `npm run dev` (https://localhost:3000) and the API from
`D:\V4Ideas\Ideali\ideali.api` (https://localhost:7163).

### Layout

| Path | Holds |
|---|---|
| `e2e/*.ui.spec.ts` | Browser journeys, run at desktop **and** 375px |
| `e2e/*.api.spec.ts` | Endpoint contract, authorisation and error shape |
| `e2e/*.database.spec.ts` | Constraints that only exist in the schema — unique indexes, filters |
| `e2e/auth.setup.ts` | Signs in through the real form, saves the session for every other project |
| `e2e/support/` | Environment reader, SQL access, campaign fixtures |

The `desktop` and `mobile` projects run the **same** `.ui.spec.ts` files at 1280px and 375px. A
responsive regression fails the suite rather than waiting for someone to resize a browser.

### Credentials

Every value lives in **`.env.e2e.local`**, which is gitignored. `.env.e2e.example` is the committed
template and carries no values. The database password is never copied into this repo at all — the
suite reads the API's own gitignored secrets file, so the credential exists in exactly one place.

A test that hardcodes a username, password or connection string is a security defect, not a shortcut.
So is any error path that lets `execFileSync` put a password into a report or trace file — see
`withoutCredentials` in `e2e/support/database.ts`.

### Rules

- Assert the rule a user depends on, never the implementation. If a test asserts a control is
  disabled, first confirm that is the actual designed behaviour — not what you assumed it would be.
- Test data comes from the database via `e2e/support/campaignFixtures.ts`. Never hardcode a GUID.
- Anything a test writes to the database, it deletes afterwards. Rows are tagged so cleanup is exact.
- Authorisation is proven from the outside: no token, a forged token, and another organiser's record
  must each be refused, and the refusal must not reveal whether the record exists.
- Every UI spec asserts no horizontal page scroll and 44px minimum touch targets.

### Phase gate

At the end of every phase, verify the work yourself rather than handing over a manual checklist:

1. `npm run build` — clean.
2. `npm run test` — every unit suite green.
3. `npm run test:e2e` — every project green, desktop and mobile.
4. Read the data back out of the database to confirm the API actually persisted what the UI sent.
5. Strike through the delivered items in `docs/p2p-build-plan.html` — see Development Document below.

Report a phase complete only when all five are done. If one cannot be run, that is the blocker to fix
first; say so plainly and name the gate that failed.

---

## Development Document

`docs/p2p-build-plan.html` is the plan of record for the peer-to-peer work.

- Every phase is a collapsible accordion, with a control to expand or collapse all of them at once.
- An item is struck through **only** once it is developed, tested and verified end to end. Not when
  the code is written — when the gate above has passed against it.
- Keeping it current is the agent's responsibility, not the reader's. It is updated in the same
  change that delivers the work, never as a follow-up.

---

## Backend Contract

- REST API. Base URL via `VITE_API_BASE_URL`; dev proxies `/api` to `https://api.testing.ideali.io`.
- Auth: JWT bearer + refresh endpoint at `/api/identity/account/refresh-token`.
- Error shape (RFC 7807):

```json
{ "title": "Validation failed", "status": 400, "errors": { "field": ["message"] } }
```

- Pagination params: `?page=1&pageSize=20`. Response: `{ items, total, page, pageSize, totalPages }`.

---

## Known Debt

Real, measured, and not to be described as solved. Do not add to any of these; reducing one is its own approved change.

| Debt | Scale | Rule for new code |
|---|---|---|
| Tokens in `localStorage` | Access + refresh + user object | Do not extend. Target: in-memory token + httpOnly cookie. |
| `console.log` in shipped code | ~259 occurrences, including token-refresh logs that print token fragments | Add none. Remove any you touch, especially ones logging tokens. |
| `: any` annotations | ~609 occurrences | Add none on a service or component boundary. |
| `strictNullChecks: false` | repo-wide | Write null guards by hand; `tsc` will not catch a missing one. |
| Test coverage is thin | Vitest covers `apiError`, `returnPath`, `session`, `peerToPeerCopy`, `peerToPeerService`, `usePeerToPeerSettings`, `usePeerToPeerSettingsForm`, `PeerToPeerMenuItem`, `Step9PeerToPeer`, `SignIn`, `FundraiseForThisButton`, `FundraiserJoinPage`, `supporterSignUpService` and `SupporterSignUpPage`. Playwright covers the peer-to-peer settings screen and endpoint, the join screen and endpoint, the supporter sign-up screen and endpoint, and the fundraiser and campaign-slug uniqueness indexes. Everything else is uncovered. | Every new change carries its own tests, unit and end-to-end. Do not widen the untested surface. |
| No ESLint config | no lint gate at all | `npm run build` plus `npm run test` are the automated gates. |
| `package-lock.json` is gitignored | CI resolves fresh versions every build | Non-reproducible builds; flagged for decision. |
| `npm audit` findings | includes a critical in `jspdf` | Do not add dependencies while unresolved. |
| `tsconfig.node.json` `moduleResolution` | `TS6046` — `vite.config.ts` never type-checks | Pre-existing; fix is its own change. |
| Pipeline Node version | `azure-pipelines.yml` pins 18.x, below Vite 7 floor | DevOps-owned. Report, never edit. |

---

## Git

- Never commit directly to the default branch unless explicitly told to. Branch first.
- Conventional commit subjects: `feat(scope):`, `fix(scope):`, `chore(scope):`, `refactor(scope):`, `test(scope):`, `docs(scope):`.
- One logical change per commit. Never bypass hooks (`--no-verify`) unless explicitly asked.
- **No check-in or commit without running the test cases. No exceptions.** Suite green before `git commit`, every time — including docs-only and one-line commits.
- A commit that adds or changes behaviour carries its tests in the same commit. "Tests to follow" is not acceptable.
