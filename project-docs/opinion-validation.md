# Architecture Opinion Validation
## Nutrishift Next.js Portal — 5 Opinions Reviewed

---

## Opinion 1 — Eliminate Ghost SSO Magic Link
**Verdict: ❌ Invalid — based on a misunderstanding of the actual architecture**

### The Actual Flow (Confirmed by User)

The portal does **not** fetch Ghost content into Next.js. Users are redirected **to Ghost's own frontend** at `blog.nutri-shift.com`:

```
User logs into portal.nutri-shift.com (Next.js / ERPNext auth)
        │
        │  User clicks "Read Blog" / navigates to content
        │
        ▼
Next.js builds a signed Ghost SSO JWT (server-side, takes <1ms)
        │
        ▼
User is redirected to:
blog.nutri-shift.com/members/api/send-magic-link/?token=<JWT>&email=<email>
        │
        ▼
Ghost verifies the JWT signature using the Admin API key
Ghost finds or creates the member record
Ghost sets its own session cookie on blog.nutri-shift.com
        │
        ▼
User is now natively logged into Ghost — sees paid content, comments,
newsletter preferences, all Ghost member features — with zero second login
```

### Why the Opinion is Wrong for This Use Case

The opinion said: *"bypass Ghost's frontend authentication entirely — fetch content with a master key into Next.js."*

That only works if Next.js IS the frontend for the content. Here, **Ghost IS the frontend**. Users visit `blog.nutri-shift.com` natively. Ghost renders the pages. Ghost enforces its own member tiers for content access. For this to work:

- ✅ Ghost member accounts **must exist** (provisioned on first ERPNext login)
- ✅ Ghost SSO via signed JWT redirect **is the correct and necessary mechanism**
- ✅ The `buildGhostSSOUrl()` function in the original plan **is correct**
- ❌ Fetching content into Next.js would bypass Ghost's native UI — that's the wrong model here

### Two Factual Errors in the Opinion

| Claim | Reality |
|---|---|
| "endpoint physically emails the patient" | The JWT token redirect is **not an email**. Ghost verifies the JWT server-side and auto-creates a session. No email is ever sent. |
| "you do not need to mirror user accounts in Ghost" | You do — users visit Ghost's own frontend. Ghost needs the member record to know their tier and show/hide content. |

### The Ghost SSO JWT — What It Actually Does
```typescript
// lib/ghost/sso.ts — called during ERPNext login
import 'server-only'
import { SignJWT } from 'jose'

export async function buildGhostSSOUrl(email: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.GHOST_ADMIN_API_KEY!)

  // Signed JWT — Ghost verifies this server-side on blog.nutri-shift.com
  const token = await new SignJWT({ sub: email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')  // Short-lived, single-use
    .setAudience('ghost')
    .sign(secret)

  // This URL auto-logs the user into Ghost — no email, no manual step
  const params = new URLSearchParams({ token, email })
  return `${process.env.GHOST_URL}/members/api/send-magic-link/?${params}`
}
```

When the user is redirected to this URL, Ghost:
1. Decodes and verifies the JWT
2. Finds or creates the Ghost member by email
3. Sets a `ghost-members-ssr` session cookie on `blog.nutri-shift.com`
4. Redirects to the homepage — user is logged in, sees their tier content

**Zero emails. Zero friction. One login covers both ERPNext portal and Ghost blog.**

### Decision: Original Plan was Correct — Reject this Opinion ❌

---

## Opinion 2 — Event-Based Caching (ERPNext Webhooks → revalidateTag)
**Verdict: ✅ Valid — and an improvement over time-based polling**

### The Opinion is Correct
`revalidate: 60` creates unnecessary load on ERPNext (polling every 60s for every cached resource) AND still has a stale window. On-demand revalidation solves both.

The pattern:
```
ERPNext saves a Patient record
  → ERPNext Webhook fires → POST /api/webhooks/erpnext (Next.js)
  → Next.js calls revalidateTag(`patient-${patient_id}`)
  → Next cache is purged instantly
  → Next request hits ERPNext fresh, caches again
```

### How ERPNext Webhooks Work (Practical Note)
ERPNext has a built-in **Webhook doctype** under Settings → Integrations → Webhooks. You configure:
- **DocType**: `Patient` / `Patient Appointment` / `Diet Plan`
- **Event**: `on_update`
- **Request URL**: `https://portal.nutri-shift.com/api/webhooks/erpnext`
- **Headers**: Include a shared secret for HMAC verification

Zero Python code needed — it's a UI configuration.

### One Caveat: Clinical Data Should Not Be `force-cache`
`cache: 'force-cache'` with no fallback means if the ERPNext webhook fails (network blip, Frappe downtime), the data stays stale **forever** until the next successful webhook. For a clinical portal, stale diet plans or appointments are a real problem.

**Better hybrid:**
```typescript
// For clinical data: short TTL as safety net + tag-based invalidation
next: { revalidate: 300, tags: [`patient-${patientId}`] }
// Normally invalidated instantly by webhook
// Falls back to 5-minute refresh if webhook misses
```

```typescript
// For Ghost content (non-clinical): long cache is fine
next: { revalidate: 3600, tags: ['ghost-content'] }
```

### Accept with Modification ✅

---

## Opinion 3 — JWT "Poison Pill" / 401 Handling
**Verdict: ✅ Valid — and this is a real gap in the original plan**

### The Gap is Real
The original plan throws `ERPNextError(401, endpoint)` but doesn't define what happens next. The JWT in the patient's browser cookie remains valid. Every subsequent navigation will keep hitting ERPNext with revoked credentials — an infinite 401 loop.

### The Correct Implementation

**In `lib/erpnext/client.ts` (server-side):**
```typescript
import { redirect } from 'next/navigation'

if (res.status === 401) {
  // This runs on the server. redirect() in Next.js App Router
  // clears the navigation stack and sends a 307 to the client.
  // Pair with a /auth-error page that calls signOut() on mount.
  redirect('/auth-error?reason=session_revoked')
}
```

**Create `app/auth-error/page.tsx` (client component):**
```typescript
'use client'
import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AuthError() {
  const reason = useSearchParams().get('reason')

  useEffect(() => {
    // Clears the HttpOnly cookie via Auth.js
    signOut({ callbackUrl: '/login?reason=' + reason })
  }, [])

  return <p>Clearing your session…</p>
}
```

This chain: ERPNext 401 → server `redirect()` → client `signOut()` → clears cookie → `/login`. Clean and complete.

### Accept ✅

---

## Opinion 4 — Decouple Payment Webhooks from Next.js (Point Directly to ERPNext)
**Verdict: ❌ Invalid — the proposed solution is architecturally worse, not better**

### The Concern is Legitimate
A webhook arriving while Next.js is unavailable = missed payment upgrade. Real concern.

### But the Proposed Solution Reverses the Risk
The opinion says: point webhooks directly to ERPNext (your Frappe VPS) instead of Next.js (Vercel).

| Platform | Typical Uptime | Maintenance |
|---|---|---|
| Vercel (Next.js) | 99.99% SLA, global CDN | Zero-downtime deploys |
| Frappe VPS | ~99.5% (your VPS) | `bench update` = 5–15 min downtime |

**Sending financial webhooks to the less-reliable endpoint doesn't solve the problem — it makes it worse.**

### Stripe Already Solves This
Stripe retries failed webhooks on an exponential backoff for **72 hours**. If your Next.js endpoint is down for 30 seconds during a deploy, Stripe retries automatically. You miss nothing.

```
Stripe fires webhook → Next.js /api/webhooks/payment
  → Verify HMAC signature (reject if invalid)
  → Call ERPNext to upgrade patient role
  → If ERPNext is down: return 500 to Stripe → Stripe retries in 1 min
  → If Next.js is down: Stripe retries on next attempt → Next.js is back up in seconds
```

### The Actual Right Answer: ERPNext as Source of Truth, Next.js as Relay
What the opinion gets right: ERPNext should be the system of record for subscription state. The flow should be:

```
Stripe → Next.js /api/webhooks/payment (HMAC verify)
  → ERPNext: update Customer subscription status  ← ERPNext owns the state
  → revalidateTag(patient_id)                     ← Portal cache purged
  → Return 200 to Stripe
```

Next.js is not storing payment state. It's relaying the event to ERPNext (which owns the state) and invalidating its own cache. This is correct.

### Reject ❌

---

## Opinion 5 — Centralize Clinical Zod Schemas (Validate ERPNext Responses)
**Verdict: ✅ Fully Valid — this is a must-have, not a nice-to-have**

### Frappe API Response Shape is Inconsistent
ERPNext returns data in at least three shapes depending on the endpoint:

```typescript
// Single document
{ "data": { "name": "...", "meal_name": "..." } }

// List
{ "data": [{ ... }, { ... }] }

// Custom methods
{ "message": { ... } }
{ "message": "some string" }  // also valid!
```

Without Zod, you get silent `undefined` bugs when a field is renamed in ERPNext. With Zod, the server throws immediately and you see it in Sentry before a patient does.

### Implementation in `lib/erpnext/client.ts`

```typescript
import { z } from 'zod'

// Define schemas in lib/erpnext/types.ts
export const PatientSchema = z.object({
  name: z.string(),
  patient_name: z.string(),
  email: z.string().email(),
  mobile: z.string().optional(),
  custom_subscription_tier: z.enum(['free', 'paid', 'admin']).default('free'),
})

export const DietPlanSchema = z.object({
  name: z.string(),
  plan_name: z.string(),
  meals: z.array(z.object({
    meal_time: z.string(),
    items: z.array(z.object({
      food_name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }))
  }))
})

// In lib/erpnext/client.ts — parse before returning
async function erpFetch<T>(endpoint: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(...)
  const json = await res.json()

  // Handles both { data: ... } and { message: ... } shapes
  const raw = json.data ?? json.message

  return schema.parse(raw) // Throws ZodError if shape changed in ERPNext
}
```

### Accept ✅

---

## Summary of Changes to Architecture Plan

| Opinion | Verdict | Action |
|---|---|---|
| 1. Ghost SSO magic link trap | ❌ **Invalid** | Users go to `blog.nutri-shift.com` (Ghost native). Ghost member accounts required. JWT SSO redirect is correct — no email, no friction. Original plan was right. |
| 2. Event-based caching | ✅ Valid | Replace `revalidate: 60` with `revalidate: 300` (safety TTL) + `revalidateTag()` via ERPNext Webhooks doctype |
| 3. JWT Poison Pill 401 handling | ✅ Valid | Add `redirect('/auth-error')` on ERPNext 401 + `auth-error` page that calls `signOut()` |
| 4. Route webhooks to ERPNext | ❌ Invalid | Keep webhooks on Next.js/Vercel (higher uptime). Stripe retries handle transient failures. ERPNext remains state owner |
| 5. Zod validation on ERPNext responses | ✅ Valid | Add `schema.parse(json.data ?? json.message)` in `erpFetch()`. Define schemas in `lib/erpnext/types.ts` |
