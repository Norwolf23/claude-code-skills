---
name: vibe-proof
description: |
  Security-focused hardening for vibe-coded full-stack apps. Runs parallel
  audits across frontend, backend, and config layers, then fixes issues
  systematically by severity. Covers injection, PII exposure, missing
  headers, error leakage, dead code, and credential hygiene.
triggers:
  - /vibe-proof
  - security audit this project
  - harden the security
  - vibe-code proof this
  - make this secure
---

# Vibe-Proof: Security Hardening for Full-Stack Apps

**Purpose:** Systematically audit and fix security vulnerabilities in vibe-coded
full-stack applications through parallel multi-agent analysis and guided remediation.

## Origin

Extracted from a real hardening session on a React + Express + Stripe e-commerce
platform deployed to Vercel. The audit found 61 issues across frontend, backend,
and config layers -- including a SQL injection vector, hardcoded PII, API tokens
in URLs, `.env` files tracked in git, and 45+ unstructured console.log calls.
All fixed in a single session with parallel agent scanning. (Feb 2026)

## When to Use

- After vibe-coding an MVP with API routes, databases, or payment integrations
- Before first real deployment or first real customer
- When you suspect "it works but is it safe?"
- Any Express/React/Next.js/Nuxt app with a backend

## The Seven Security Checks

### 1. Injection Vectors
- [ ] No user input in SQL/query strings without parameterization
- [ ] Sort columns, filter fields use whitelist validation
- [ ] No `eval()`, `new Function()`, or template literal injection
- [ ] URL params parsed with bounds checking (parseInt with min/max)

### 2. PII & Secret Exposure
- [ ] No hardcoded addresses, phone numbers, names in source
- [ ] API tokens in headers (Authorization), never in URL params
- [ ] No `.env` files tracked in git (check `git ls-files | grep env`)
- [ ] No secrets in client-side code or VITE_* vars that shouldn't be public
- [ ] `.env.example` documents all required variables

### 3. Missing Security Headers
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (or SAMEORIGIN if iframes needed)
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Strict-Transport-Security` (HSTS) on production
- [ ] Body size limits on `express.json()` and `express.urlencoded()`

### 4. Error Leakage
- [ ] Production error responses don't expose stack traces
- [ ] 500 errors return generic message, not `error.message`
- [ ] No `console.log` of sensitive data (tokens, passwords, PII)
- [ ] Structured logger used instead of console.* in production code

### 5. Input Validation Gaps
- [ ] All POST/PUT endpoints validate body with Zod or equivalent
- [ ] Query params have type coercion and bounds (limit, offset, id)
- [ ] Integer params checked against MAX_INT (2147483647)
- [ ] Enum params validated against allowed values
- [ ] File uploads have size and type restrictions

### 6. Dead Code & Attack Surface
- [ ] Unused routes/endpoints removed
- [ ] Unused components deleted (not commented out)
- [ ] Disabled features removed entirely (not just `if(false)`)
- [ ] Test/debug endpoints not in production
- [ ] Unused npm packages removed

### 7. Credential Hygiene
- [ ] Session secrets are 32+ characters
- [ ] Cookies: `httpOnly`, `secure` (production), `sameSite: 'lax'`
- [ ] Trust proxy configured when behind reverse proxy (Vercel, nginx)
- [ ] Webhook endpoints verify signatures (Stripe, etc.)
- [ ] Rate limiting on auth, checkout, and newsletter endpoints

## Execution Process

### Phase 1: Parallel Audit (Read-Only)

Launch 3 specialized agents in parallel to scan different layers simultaneously:

**Agent 1: Frontend Audit**
```
Audit the frontend code for security issues:
- XSS vectors (dangerouslySetInnerHTML, unescaped user input)
- Sensitive data in client-side code
- Tracking pixels with undefined variables
- Console.log statements leaking data
- Dead/unused components
- API keys or tokens in VITE_* env vars that shouldn't be public
Report each issue with file:line, severity, and fix suggestion.
```

**Agent 2: Backend/API Audit**
```
Audit the backend code for security issues:
- SQL injection (user input in query strings, unvalidated sort/filter)
- Missing input validation on POST/PUT endpoints
- Hardcoded PII (addresses, phone numbers, names)
- API tokens in URL params instead of headers
- Console.log/error statements (should use structured logger)
- Error handlers leaking internal details
- Missing rate limiting on sensitive endpoints
- Webhook signature verification
Report each issue with file:line, severity, and fix suggestion.
```

**Agent 3: Config & Credential Audit**
```
Audit configuration and credentials:
- .env files tracked in git (git ls-files | grep env)
- Security headers present/missing
- Body size limits configured
- Session configuration (secret length, cookie flags)
- Trust proxy setting
- Dead code files (unused components, disabled features)
- Unused npm dependencies
Report each issue with file:line, severity, and fix suggestion.
```

### Phase 2: Synthesize & Prioritize

Combine all findings into a single prioritized list:

| Priority | Category | Fix Order |
|----------|----------|-----------|
| CRITICAL | Injection, credential leaks, undefined vars | Fix first |
| HIGH | PII exposure, missing validation, error leakage | Fix second |
| MEDIUM | Console.log, dead code, missing headers | Fix third |
| LOW | Unused packages, config optimization | Fix last |

### Phase 3: Systematic Fix Execution

Fix in priority order. After each fix category:
1. Run `npm run build` (or project equivalent)
2. Verify no regressions

**Common Fix Patterns:**

#### SQL Injection (Whitelist Pattern)
```typescript
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  'created': 'created_at',
  'rating': 'average_rating',
  'name': 'name',
  'price': 'price::numeric',
};

if (filters?.sortBy && ALLOWED_SORT_COLUMNS[filters.sortBy]) {
  const sortColumn = ALLOWED_SORT_COLUMNS[filters.sortBy];
  query += ` ORDER BY ${sortColumn}`;
}
```

#### PII Extraction (Env Var Pattern)
```typescript
// BEFORE: Hardcoded PII
const SENDER = { name: 'John Doe', street: '123 Main St' };

// AFTER: Environment variables with safe fallbacks
const SENDER = {
  name: process.env.SENDER_NAME || 'Company Name',
  street: process.env.SENDER_STREET || '',
};
```

#### API Token in Header (Not URL)
```typescript
// BEFORE: Token in URL (visible in logs, browser history)
const url = `${API_URL}?access_token=${TOKEN}`;

// AFTER: Token in Authorization header
const url = API_URL;
headers: { 'Authorization': `Bearer ${TOKEN}` }
```

#### Security Headers Middleware
```typescript
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

#### Console.log Migration
```typescript
// BEFORE
console.log('Processing order:', orderId);
console.error('Failed:', error);

// AFTER (structured logger)
logger.info('Processing order', { orderId });
logger.error('Failed', { error });
```

#### Error Response Masking
```typescript
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  // Don't leak internals in production
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : message
  });
});
```

### Phase 4: Credential Remediation

If `.env` files were tracked in git:
```bash
# Add to .gitignore
echo ".env.production" >> .gitignore

# Remove from tracking (keeps local file)
git rm --cached .env.production

# Alert: Rotate ALL exposed credentials
```

**Credentials that MUST be rotated if exposed:**
- Database passwords
- API keys (Stripe, Shippo, Resend, etc.)
- Session secrets
- Webhook signing secrets

### Phase 5: Environment Variable Provisioning

If deploying to Vercel, set env vars via API:
```bash
# Get project ID
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects?teamId=$TEAM_ID" | \
  jq '.projects[] | select(.name == "PROJECT_NAME") | .id'

# Set env var
curl -s -X POST \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "VAR_NAME", "value": "VAR_VALUE", "type": "encrypted", "target": ["production", "preview"]}'
```

### Phase 6: Verify & Deploy

```bash
# Build verification
npm run build

# Commit (conventional commit format)
git commit -m "fix(security): harden platform -- [summary of fixes]"

# Push and deploy
git push origin main
```

## Success Criteria

- [ ] Build passes with zero warnings
- [ ] No user input reaches SQL without parameterization or whitelist
- [ ] No PII in source code
- [ ] No API tokens in URLs
- [ ] No .env files tracked in git
- [ ] Security headers present on all responses
- [ ] All console.* replaced with structured logger
- [ ] Error responses don't leak internals
- [ ] All POST/PUT endpoints validate input
- [ ] Dead code deleted (not commented)
- [ ] Exposed credentials rotated

## Lessons Learned

1. **Parallel audit agents save massive time.** 3 agents scanning different layers simultaneously catches issues that sequential review misses.

2. **Sort columns are the #1 SQL injection vector in vibe-coded apps.** Everyone parameterizes WHERE clauses but forgets ORDER BY.

3. **`.env` files in git are shockingly common.** Always check `git ls-files | grep -i env` as the very first step.

4. **Console.log migration is tedious but critical.** 45+ calls across 7 files is typical for a vibe-coded MVP. Batch it with a dedicated agent.

5. **Vercel API for env vars is faster than the dashboard.** One curl loop sets 10 variables in seconds vs. clicking through the UI.

6. **Check BOTH server entry points.** Many projects have `server/index.ts` (dev) AND `server/api-entry.ts` (serverless). Security headers must be on both.

7. **Meta Pixel tracking bugs are invisible until checkout.** The `total` variable undefined before declaration pattern is easy to miss because the page still loads -- it just sends `undefined` to Facebook.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
