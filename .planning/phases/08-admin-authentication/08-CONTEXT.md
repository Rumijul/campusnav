# Phase 8: Admin Authentication - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Protect all admin/map editor routes behind email/password login while keeping student-facing wayfinding fully accessible without any login. This phase delivers the auth layer only — the editor itself (phases 9–10) is out of scope. A single admin identity is sufficient; multi-admin management is not part of this phase.

</domain>

<decisions>
## Implementation Decisions

### Token storage & session security
- Store JWT in an **httpOnly cookie** (not localStorage) — JavaScript cannot read it, protecting against XSS
- Apply **SameSite cookie policy** and include a **CSRF token** alongside the cookie for full CSRF protection
- Admin API route structure is **Claude's discretion** (e.g., `/api/admin/*` prefix vs per-route middleware)

### Login page design
- **Minimal utility page** — plain form, no heavy branding or decoration
- Error messages are **generic only**: "Invalid credentials" — do not reveal whether email or password was wrong (prevents user enumeration)
- **Disable the submit button and show a spinner** while the login request is in-flight (prevents double-submit)
- Post-login redirect destination is **Claude's discretion** (redirect-to-original-URL or fixed dashboard)

### Session duration & expiry
- Session TTL: **1–4 hours** (short, security-first)
- **No "remember me" checkbox** — all sessions use the short TTL
- **Visible logout button** in the admin interface; clicking it clears the httpOnly cookie server-side
- When the frontend detects an expired session (401 from API): **show a toast/message** ("Session expired, please log in again"), then redirect to the login page
- Silent refresh strategy is **Claude's discretion** — given the short TTL and no remember-me, a simple redirect on 401 is likely sufficient

### Admin credential provisioning
- Admin credentials are stored in **environment variables** (email + bcrypt-hashed password in `.env`) — no DB user table required
- Number of supported admin accounts is **Claude's discretion** (single admin is the primary use case)
- Admin registration / change-password UI is **Claude's discretion**
- **Brute-force protection**: Lock out login attempts after N consecutive failures within a time window (e.g., 5 attempts → 10-minute block). Exact thresholds at Claude's discretion.

### Claude's Discretion
- Admin route prefix structure (`/api/admin/*` vs per-route auth middleware)
- Post-login redirect destination
- Silent refresh vs redirect-on-401 strategy
- Number of admin accounts the .env supports (array vs single pair)
- Whether to include a change-password UI inside the admin panel
- Exact lockout thresholds for brute-force protection
- Temp cookie / session state during lockout period

</decisions>

<specifics>
## Specific Ideas

- No specific references mentioned — open to standard patterns for httpOnly cookie + JWT auth with a Hono backend
- The login page is intentionally bare; it's an internal tool rarely visited by non-admins

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-admin-authentication*
*Context gathered: 2026-02-21*
