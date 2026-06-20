---
description: Pre-checkin quality gate for TechFlow — code review, hardcoding scan, job assignment, and post generator checks
---

# TechFlow Pre-Checkin Quality Gate

Run this before every commit or PR. It covers four areas in sequence:
1. Static code review (no hardcoding, security, tenant isolation)
2. Build + lint validation
3. Job assignment functional check
4. Post generator functional check

Abort and report failures immediately. Do not continue past a blocking failure.

---

## Step 1 — Static Code Review

### 1a. Hardcoding scan

Search the `src/` directory for common hardcoding patterns. Flag any matches as **FAIL**:

```bash
# Hardcoded company IDs, user IDs, or UUIDs in source (not in tests)
grep -rn --include="*.ts" --include="*.tsx" \
  -E "(companyId\s*[=:]\s*['\"][0-9a-f-]{36}['\"]|userId\s*[=:]\s*['\"][0-9a-f-]{36}['\"])" \
  src/

# Hardcoded emails
grep -rn --include="*.ts" --include="*.tsx" \
  -E "['\"][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['\"]" \
  src/ | grep -v "placeholder\|example\|test\|TODO\|zod\|schema\|validate\|pattern\|regex"

# Hardcoded API keys or secrets (not env var references)
grep -rn --include="*.ts" --include="*.tsx" \
  -E "(api_key|apiKey|secret|password|token)\s*[=:]\s*['\"][A-Za-z0-9+/]{16,}" \
  src/

# Hardcoded localhost URLs in non-dev files
grep -rn --include="*.ts" --include="*.tsx" \
  "localhost:3000" \
  src/ | grep -v "\.env\|comment\|//.*localhost"
```

For each match found: print file path, line number, and the matched line. Mark as **FAIL**.
If no matches: print "Hardcoding scan: PASS".

### 1b. Auth + tenant isolation check

For every file changed in this branch (`git diff --name-only main...HEAD` filtered to `src/app/api/**`), verify:

- `auth()` is called at the top of each route handler
- DB queries on `jobs`, `posts`, `users`, `ats_connections` include `eq(table.companyId, currentUser.companyId)` (tenant scope)
- Admin-only mutations check `currentUser.role !== 'company_admin'`

Read each changed API route file and report:
- **PASS** — auth + tenant scope present
- **WARN** — file touches DB but pattern is unclear (flag for manual review)
- **FAIL** — no `auth()` call found

### 1c. Short URL check

Confirm that `/api/posts/generate/route.ts` uses the short URL (`/j/{jobId}`) in generated post text, NOT the raw `applyUrl` or `careerPageUrl`.

```bash
grep -n "postApplyUrl\|/j/\${" src/app/api/posts/generate/route.ts
```

- **PASS** if `postApplyUrl` or `/j/` pattern appears in the prompt string
- **FAIL** if the long `applyUrl` / `careerPageUrl` is used directly in the Claude prompt

Also verify the redirect route exists:
```bash
ls src/app/j/\[jobId\]/route.ts 2>/dev/null && echo "redirect route EXISTS" || echo "FAIL: redirect route missing"
```

---

## Step 2 — Build + Lint

Run lint first (faster), then build. Stop on first failure.

```bash
npm run lint 2>&1 | tail -20
```

If lint fails: print the errors and stop. Mark **FAIL**.

```bash
npm run build 2>&1 | tail -30
```

If build fails: print the errors and stop. Mark **FAIL**.
If both pass: print "Build + Lint: PASS".

---

## Step 3 — Job Assignment Check

The dev server must be running on `http://localhost:3000`. If it is not, print:
> Dev server not running. Start it with `npm run dev` then re-run `/precheck`.
> Skipping runtime checks.

And skip Steps 3 and 4.

If the server is running, check these API endpoints with curl (unauthenticated — expect 401, not 500):

```bash
# Should return 401 Unauthorized, not 500
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/jobs
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/jobs/fake-id
```

- **PASS** if both return `401`
- **FAIL** if either returns `500` (unhandled error, likely missing auth() guard)

Then verify job assignment PATCH route exists and guards correctly:
```bash
curl -s -o /dev/null -w "%{http_code}" -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"assignedRecruiterId":"test"}' \
  http://localhost:3000/api/jobs/fake-id
```
- **PASS** if returns `401`
- **FAIL** if returns `500`

### Job assignment code review

Read `src/app/api/jobs/[id]/route.ts` and verify:
- PATCH handler checks `currentUser.role !== 'company_admin'` before allowing assignment
- `assignedRecruiterId` is validated against the same `companyId` (recruiter must belong to same company)
- Response includes updated job row

Report any missing guards as **FAIL**.

---

## Step 4 — Post Generator Check

Check the generate endpoint (unauthenticated):
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"jobId":"fake"}' \
  http://localhost:3000/api/posts/generate
```
- **PASS** if returns `401`
- **FAIL** if returns `500`

### Post generator code review

Read `src/app/api/posts/generate/route.ts` and verify all of these:

| Check | Expected |
|-------|----------|
| `ANTHROPIC_API_KEY` read from `process.env` | Yes — not hardcoded |
| Short URL built from `AUTH_URL` / `NEXTAUTH_URL` env var | Yes |
| Fallback if env var is missing | Uses `applyUrl` as fallback, not empty string |
| `jobId` validated before DB query | Yes |
| Response contains `variants` array with 3 items | Yes |
| Company data scoped to `currentUser.companyId` | Yes |

Report any missing items as **WARN** or **FAIL** (hardcoded key = FAIL; missing fallback = WARN).

---

## Final Report

Print a summary table:

```
╔══════════════════════════════════════╗
║       TechFlow Pre-Checkin Report     ║
╠══════════════════════════════════════╣
║ Hardcoding scan          [PASS/FAIL] ║
║ Auth + tenant isolation  [PASS/FAIL] ║
║ Short URL in posts       [PASS/FAIL] ║
║ Build + Lint             [PASS/FAIL] ║
║ Job assignment API       [PASS/FAIL] ║
║ Job assignment code      [PASS/FAIL] ║
║ Post generator API       [PASS/FAIL] ║
║ Post generator code      [PASS/FAIL] ║
╠══════════════════════════════════════╣
║ OVERALL                  [GO / STOP] ║
╚══════════════════════════════════════╝
```

- **GO** — all checks PASS (WARNs are listed but do not block)
- **STOP** — one or more FAILs; list each with file path and line number

Do not suggest committing if OVERALL is STOP.
