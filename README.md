# Nutrishift-Portal (Next.js 16 Standalone)

> **Enterprise-grade, safety-first client & patient portal for Nutrishift Clinical Nutrition.**  
> Built as a fully decoupled Backend-for-Frontend (BFF) orchestrating ERPNext (Marley HMS) clinical records, Ghost CMS educational content, and future payment gateways without microservice sync overhead.
>
> 📁 **Detailed Architecture & Decisions**: See the [`project-docs/`](./project-docs/) directory for complete system blueprints, decision matrices, and opinion validation records.

---

## 🏗️ 1. Architecture Overview

```
                                ┌────────────────────────┐
                                │    Patient Browser     │
                                └───────────┬────────────┘
                                            │ HTTPS / HttpOnly Cookie
                                            ▼
                  ┌─────────────────────────────────────────────────────┐
                  │          portal.nutri-shift.com                     │
                  │          Next.js 16 (App Router + Turbopack)        │
                  │                                                     │
                  │  ┌───────────────────────┐ ┌─────────────────────┐  │
                  │  │     src/proxy.ts      │ │  src/auth.config.ts │  │
                  │  │ (Next.js 16 Guard)    │ │   (Edge Session)    │  │
                  │  └───────────────────────┘ └─────────────────────┘  │
                  │                                                     │
                  │  ┌───────────────────────────────────────────────┐  │
                  │  │          src/lib/ (Server-Only BFF)           │  │
                  │  │  • erpnext/client.ts   (Zod-Validated HMS)    │  │
                  │  │  • ghost/sso.ts        (Signed JWT Bridge)    │  │
                  │  │  • ghost/admin.ts      (Auto-Provisioning)    │  │
                  │  └───────────────────────────────────────────────┘  │
                  └──────────┬─────────────────┬───────────────────┬────┘
                             │                 │                   │
                             ▼                 ▼                   ▼
                     ┌──────────────┐  ┌───────────────┐  ┌────────────────┐
                     │   ERPNext    │  │   Ghost CMS   │  │ Payment / APIs │
                     │ (Marley HMS) │  │  (Blog / Hub) │  │(Stripe / Tally)│
                     │              │  │               │  │                │
                     │  • Patients  │  │  • Member SSO │  │  • Subscriptions│
                     │  • Diet Plan │  │  • Premium Hub│  │  • Webhooks    │
                     │  • Appts     │  │  • Guides     │  │  • Checkout    │
                     └──────────────┘  └───────────────┘  └────────────────┘
```

---

## 🎯 2. Core Architectural Decisions

### Decision 1: Single Source of Truth Identity (No Separate Database)
- **Problem**: Maintaining a separate database for portal users creates data drift, dual password resets, and complex synchronization workers.
- **Solution**: **ERPNext is the authoritative identity and clinical database.**
  - The Next.js portal stores **no user records in a local DB**.
  - On login, Next.js authenticates directly with ERPNext (`/api/method/login`).
  - Auth.js mints an encrypted `HttpOnly` JWT cookie containing the patient ID, user role (`free` | `paid` | `admin`), and session token.
  - Ghost member accounts are automatically linked/provisioned on first login.

### Decision 2: The "No-Microservices" BFF Pattern
- **Rule**: *"If data belongs to a system, query that system. Never duplicate it."*
- Next.js acts as an orchestration gateway (Backend-for-Frontend):
  - Clinical records, appointments, diet plans $\rightarrow$ queried from ERPNext via Server Components.
  - Articles, nutrition guides, newsletters $\rightarrow$ hosted on Ghost CMS (`blog.nutri-shift.com`).
  - Billing & subscriptions $\rightarrow$ processed through payment webhooks that directly update ERPNext customer records.

### Decision 3: Next.js 16 App Router & `proxy.ts`
- Initialized on **Next.js 16.4.3** with React 19 and Turbopack.
- Adopts Next.js 16's official `proxy.ts` standard for Edge route protection and session verification.
- Enforces strict server boundaries with the `server-only` package in `src/lib/`, preventing accidental exposure of API secrets to browser bundles.

### Decision 4: Frictionless Ghost SSO Bridge (Zero Email Friction)
- **Problem**: Standard Ghost magic link endpoints send physical emails to patients, breaking the single-login portal experience.
- **Solution**: Implemented a **signed JWT redirect** in `src/lib/ghost/sso.ts`.
  - When an authenticated patient clicks *"Nutrition Guides"* or visits `/api/auth/ghost-sso`, Next.js creates a short-lived (5-minute) signed JWT using the Ghost Admin API secret.
  - The user is redirected to `blog.nutri-shift.com/members/api/send-magic-link/?token=...`.
  - Ghost verifies the signature server-side and immediately sets the member session cookie.
  - **Result**: Immediate access to gated articles and member-only content with zero secondary password prompts or email clicks.

### Decision 5: Event-Driven On-Demand Cache Revalidation
- **Problem**: Polling or time-based cache revalidation (`revalidate: 60`) either serves stale clinical data or creates unnecessary server load on Frappe.
- **Solution**: **On-demand cache purging via ERPNext Webhooks.**
  - Next.js fetch calls use `next: { tags: ['patient-${id}'], revalidate: 300 }` (5-minute safety TTL).
  - ERPNext triggers a POST webhook to `/api/webhooks/erpnext` whenever a `Patient`, `Patient Appointment`, or `Diet Plan` document updates.
  - The route executes `revalidateTag(..., { expire: 0 })`, purging the cache instantaneously.

### Decision 6: Zod Runtime Validation on All Clinical Responses
- Frappe's REST API returns varying payload structures (`{ data: ... }` vs `{ message: ... }`).
- `src/lib/erpnext/client.ts` strictly validates every response through Zod schemas before rendering. If an ERPNext field name changes, errors are captured at the server layer without silently breaking patient UI.

### Decision 7: 401 "Poison Pill" Session Revocation
- If an administrator revokes a user's access or resets credentials in ERPNext, the portal catches the `401 Unauthorized` response in `erpFetch`.
- The server issues a redirect to `/auth-error?reason=session_revoked`, which calls `signOut()` on mount to cleanly purge browser cookies and redirect to `/login`.

---

## 📁 3. Project Directory Structure

```
nutrishift-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx             # Public sign-in interface
│   │   ├── (portal)/                      # Protected clinical routes
│   │   │   ├── layout.tsx                 # Portal shell with responsive sidebar
│   │   │   ├── dashboard/page.tsx         # Patient overview, diet status, schedule
│   │   │   ├── appointments/page.tsx      # Consultation bookings & history
│   │   │   ├── diet-plan/page.tsx         # Clinical meal protocol & timings
│   │   │   ├── measurements/page.tsx      # Weight, BMI, and vital tracking
│   │   │   └── settings/page.tsx          # Account and linked integrations
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/        # Auth.js route handler
│   │   │   ├── auth/ghost-sso/            # Ghost auto-login redirect handler
│   │   │   └── webhooks/erpnext/          # On-demand cache invalidation webhook
│   │   ├── auth-error/page.tsx            # Session purge & recovery page
│   │   ├── layout.tsx                     # Root HTML layout & fonts
│   │   └── page.tsx                       # Smart redirect root (dashboard / login)
│   │
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx                # Dynamic portal navigation with Ghost SSO link
│   │
│   ├── lib/                               # SERVER-ONLY core modules
│   │   ├── auth/
│   │   │   ├── erpnext-login.ts           # Frappe login handshake & patient resolver
│   │   │   └── types.ts                   # NutriUser & Session definitions
│   │   ├── erpnext/
│   │   │   ├── client.ts                  # Fetch wrapper, Zod parsing & cache tags
│   │   │   └── types.ts                   # Patient, DietPlan, Appointment Zod schemas
│   │   ├── ghost/
│   │   │   ├── admin.ts                   # Ghost Admin API member provisioning
│   │   │   ├── sso.ts                     # Signed JWT SSO URL builder
│   │   │   └── types.ts                   # Member & Post schemas
│   │   └── utils.ts                       # Tailwind merge & styling helpers
│   │
│   ├── auth.config.ts                     # Edge-safe authentication configuration
│   ├── auth.ts                            # Node.js runtime Auth.js export
│   └── proxy.ts                           # Next.js 16 Edge middleware guard
│
├── .env.example                           # Safe environment configuration template
├── .env.local                             # Local secrets (git-ignored)
├── next.config.ts                         # Turbopack build settings
├── package.json
└── tsconfig.json
```

---

## ⚙️ 4. Environment Configuration

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description | Example |
|---|---|---|
| `AUTH_SECRET` | Secret key for JWT session encryption | Generated via `npx auth secret` |
| `NEXTAUTH_URL` | Base public URL of portal | `http://localhost:3000` |
| `ERPNEXT_URL` | Base URL of Frappe / ERPNext instance | `https://erp.nutri-shift.com` |
| `ERPNEXT_ADMIN_API_KEY` | Admin API Key for member lookups | `abcdef12345` |
| `ERPNEXT_ADMIN_API_SECRET` | Admin API Secret | `fedcba54321` |
| `ERPNEXT_WEBHOOK_SECRET` | Shared secret for `/api/webhooks/erpnext` | `secret_token_here` |
| `GHOST_URL` | Base URL of Ghost CMS | `https://blog.nutri-shift.com` |
| `GHOST_ADMIN_API_KEY` | Ghost Admin API Key (`id:secret`) | `65f...:a1b...` |
| `GHOST_CONTENT_API_KEY` | Ghost Content API Key | `72c...` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth Client Secret | `GOCSPX-...` |

---

## 🚀 5. Development & Verification

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Typecheck and build production bundle
pnpm build

# Start production server
pnpm start
```

---

## 🔒 6. Security Guarantees

1. **Zero Secret Leakage**: `src/lib/` imports `server-only`. Any accidental client-side import causes immediate build-time failure.
2. **Encrypted Sessions**: ERPNext user credentials and API keys are sealed inside `HttpOnly; SameSite=Lax` cookies, inaccessible to client scripts (XSS protection).
3. **Strict Validation**: All external inputs and responses are strictly validated through Zod schemas.
4. **Idempotent Webhooks**: ERPNext cache revalidation webhooks verify shared secrets and execute non-destructive tag purging.

---

*Maintained by Nutrishift Clinical Technology Team.*
