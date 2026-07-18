# 3-minute demo — AI Ship Gate

**URL:** https://shipcheck-two.vercel.app  

## Preferred live scan (your controlled repo)

**Primary demo repo (you own it):**  
https://github.com/AryanTandon2019/beforesign  

Why it works for judges:
- **Next.js App Router** (stack badge matches)
- TypeScript
- Small (~38 files) → high scan coverage
- Real finding: **`src/app/api/analyze/route.ts`** missing rate limit (high)
- Also: security headers, validation, `.env.example`
- **Open PR:** Connect GitHub OAuth → real fix PR on writeable repos (hero on Fix & PR tab)

**Backup:** `namastedev/namaste-react` (public, no write access for future PR demo)

On the report, point at:
- **Detected: Next.js App Router**
- Evidence on **`src/app/api/analyze/route.ts`**

---

### 0:00–0:20 Hook

> “I built a SaaS with AI in a weekend. It works — but should I ship it?  
> General scanners assume you know CVEs. **ShipCheck is the AI ship gate for vibe-coded products.**”

---

### 0:20–1:05 Live scan

- Paste **`vercel/nextjs-subscription-payments`** (not a screenshot).  
- Wait for audit.  
- “Rules find evidence. AI maps attack paths and stack-correct fixes.”

---

### 1:05–1:30 Decision

- Headline: **Not production-ready — N high-priority risks remain** (if applicable).  
- Score weights: Security 50% · Production 30% · Practices 20%.  
- Open one issue → **file:line** + attack path.

---

### 1:30–2:30 Hero: Open PR

- Open **Fix & PR** tab.  
- **Connect GitHub** (OAuth, `repo` scope) — use a repo **you own** (beforesign).  
- Select 1–2 patches → **Open PR with fixes**.  
- Show the real GitHub PR URL (`shipcheck/fix-*` branch).  
- Optional: sandbox recheck below is static-only (honest second pass).

---

### 2:30–2:50 Founder brief / issues

- Copy decision or founder brief.  
- Optional: Founder vs Engineer on Issues tab.

---

### 2:50–3:00 Close

> “AI helped build the app. ShipCheck is the gate: decide, then open the fix PR.  
> Live at shipcheck-two.vercel.app.”

---

## Language rules (credibility)

| Say | Don’t say |
|-----|-----------|
| Preview projected score | Recheck simulation / verified re-scan |
| Generated for your detected Next.js App Router | “Not generic Express on Next” |
| Not production-ready — N high-priority risks remain | “Almost there” / “Close” |
| file:line evidence | Vague “API routes exist” with no path |
