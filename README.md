# Kwali Smart Revenue Platform (KSRP)

A unified revenue collection and compliance platform for **Kwali Area Council, FCT Abuja**. It digitises how the council registers taxpayers, issues bills and daily tickets, collects levies, verifies payments, and enforces compliance — across every revenue stream the council controls.

Built for the realities of Nigerian local-government revenue: ward-based records, NIN/CAC/RC identity references, tenement rates and property assessment, market daily tolls, keke/okada daily tickets, QR-coded receipts and ID cards, field marshals, officer approval queues, and a no-login self-service payment channel for traders with basic phones.

---

## What the platform does

### Revenue streams
- **Properties** — annual tenement rates, property assessment, GPS-tagged addresses, arrears and demand notices.
- **Businesses** — annual business premises permits for shops, offices, hospitality, POS agents, and CAC/LLC-registered companies.
- **Markets** — registered market traders and stalls, daily market tolls, stall rent, sanitation levy.
- **Transport** — keke (tricycle), okada (motorcycle) and commercial vehicles, daily ₦100/₦500 route tickets with QR stickers.
- **Sanitation / POS / Hospitality** — subscriptions, operator permits and establishment fees.

### Who uses it (roles)
| Role | What they see |
|------|---------------|
| **Taxpayer** | Their own registrations, bills, payments, receipts, and digital ID cards. |
| **Marshal** | Field operations — onboard traders/operators, record collections, verify tickets/QR, log enforcement incidents, reprint issued ID cards. |
| **Revenue Officer** | Approval queue for self-registered taxpayers, collections ledger, business/property registries, record payments. |
| **Chairman / Executive** | Read-only executive dashboard — revenue performance, ward comparison, compliance, markets, transport, enforcement, reports. |
| **Admin / Super Admin** | Everything, plus staff account creation, revenue records, and platform configuration. |

Each role lands only on the dashboard built for it. Staff never see the taxpayer portal, and taxpayers never see staff tools.

### Key features
- **Guided taxpayer registration** — a multi-step wizard for every taxpayer type. Informal taxpayers (market traders, transport operators, POS) need only name, NIN, phone and plate/stall — location and GPS are optional. Formal businesses and properties require full detail and assessment.
- **Digital ID cards** — front-and-back cards with a real, scannable QR code (encoding an opaque verify token, never personal data). Issued immediately on registration; printable as a two-page PDF.
- **Public card reprint** — anyone who lost their card enters their registered phone number on the public site and re-prints it, no login needed.
- **Real QR verification** — scanning a card or receipt QR opens a public verification page showing identity and payment standing, throttled and audited.
- **Self-service payment (no account)** — a trader with a printed ID and a basic phone can look up what they owe and get a payment reference. Amounts are always read from the database, never the client.
- **Receipts & payment lifecycle** — every confirmed payment issues an official receipt with a verification token. Reversed payments void the receipt rather than deleting it.
- **Staff account management** — admins create marshal/officer accounts; each gets a staff role and ward assignment.

---

## Tech stack

- **React 19 + TypeScript + Vite**
- **TanStack Start / Router** — file-based routing with type-safe routes, server functions (`createServerFn`) for privileged operations
- **Supabase** — Postgres database, Auth, Row-Level Security, service-role server client
- **Tailwind CSS v4** + design tokens (custom emerald/gold brand, dark sidebar)
- **shadcn-style components**, **Lucide icons**, **jsPDF** (PDF receipts/ID cards), **qrcode** (real scannable QR), **Leaflet + MapTiler** (GIS/ward maps)

---

## Project structure

```
src/
├── app/                    # App entry, router, global styles & design tokens
│   └── styles/styles.css   # Tailwind theme, brand colors, surface-card, badges
├── routes/                 # File-based routes (TanStack Router)
│   ├── (public)/           # Home, register, pay, verify, reprint-card, contact
│   ├── (auth)/             # Login / signup
│   ├── (dashboard)/        # Taxpayer portal, marshal & officer dashboards
│   ├── (admin)/            # Admin pages — registries, revenue, markets, transport,
│   │                       #   compliance, notices, GIS, reports, staff accounts
│   └── api/public/         # Public, no-login API (lookup, pay-reference,
│                           #   verify-receipt, id-card-by-phone) — rate-limited + audited
├── shared/
│   ├── components/
│   │   ├── layout/         # DashboardShell (dark sidebar shell), SiteShell, RoleGuard
│   │   └── ui/             # TaxpayerIdCard, IssuedIdCards, SectionTabs, StatusBadge, …
│   ├── hooks/              # useAuth (session + roles)
│   ├── lib/
│   │   ├── api/            # Server functions (registration, staff, taxpayer accounts)
│   │   ├── revenue.ts      # recordPayment, approvals, ledger helpers (RLS-enforced)
│   │   ├── public-pay.ts   # Typed client for the public payment API
│   │   ├── qr.ts           # Real QR generation + verify URLs
│   │   └── exporters.ts    # jsPDF receipts & two-page ID cards
│   └── assets/             # Crest, category imagery
├── integrations/
│   ├── supabase/           # Supabase client, service-role server client, types
│   └── oauth/              # Social sign-in helper (Google/Apple/Microsoft)
└── features/               # Domain modules (bylaws, markets, transport, …)

supabase/
└── migrations/             # All schema, RLS policies, roles, payment lifecycle,
                            # receipts, public identity (qr_token), verification RPCs
```

---

## Data & security model

- **Seven registration tables** (`businesses`, `properties`, `market_stalls`, `transport_vehicles`, `hospitality_permits`, `pos_operators`, `sanitation_subscriptions`), each with a public `ref` and an opaque `qr_token` for identity verification.
- **Row-Level Security** everywhere — owners read their own rows; staff read via `has_role`/`has_any_role`. Privileged writes go through service-role server functions.
- **Payments ledger** — a single `payments` table; confirmed payments trigger receipt issuance. Idempotency keys prevent double-charging.
- **Public API surface** — anonymous callers never touch the database directly. All public operations go through `/api/public/*` routes with IP throttling, audit logging, and timing equalisation (a "found" and a "not found" are indistinguishable).
- **Identity disclosure is layered** — a scanned QR token (unguessable) unlocks payer context; a typed reference confirms authenticity only. Names are masked in public responses.

---

## Getting started

### Prerequisites
- Node.js 18+ (or Bun)
- A Supabase project

### Setup
```bash
npm install
```

Create a `.env` (already git-ignored):
```env
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_SERVICE_ROLE_KEY="<service role key>"   # server only — never expose
VITE_SUPABASE_URL="https://<project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_PROJECT_ID="<project id>"
VITE_MAPTILER_API_KEY="<maptiler key>"
SITE_URL="https://your-domain"                    # for email verification redirects
```

### Database
```bash
supabase db push      # apply all migrations in supabase/migrations
```

### Run
```bash
npm run dev
```

### Seed demo accounts
```bash
curl -X POST http://localhost:8080/api/public/seed-demo
```
Creates real auth users (admin / chairman / officer / marshal / taxpayer) with sample data. Password for all: `Kwali2026!`.

---

## Notes

- The public payment and identity API routes are the **only** anonymous surface — the SQL functions behind them are granted to `service_role` only.
- ID-card and receipt QR codes encode an **opaque token**, never a name, amount, or internal ID.
- Email verification requires SMTP configured in Supabase (Auth → SMTP) for delivery in production.
