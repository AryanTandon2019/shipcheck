# ShipCheck — AI Ship Gate

> **AI helps people ship apps fast. ShipCheck is the AI that decides whether that app is safe enough to ship — and gives the exact, verified path to fix it.**

**Live:** https://shipcheck-two.vercel.app  

Not a better Snyk clone. An **AI ship gate for vibe-coded products**.



---

## One sentence for judges

General security scanners assume you know what a CVE is. **ShipCheck is for the non-technical solo founder shipping AI-generated code who doesn’t.**

---

## Reasoning engine

```text
Rules find evidence → AI understands the app/stack → attack path + business impact
→ framework-correct patch → proof-of-fix projection → founder ship decision
```

| Step | What you see |
|------|----------------|
| Detect | `Detected: Next.js App Router` (+ badges) |
| Evidence | File + lines + confidence |
| Attack path | How this gets abused in *this* app |
| If you ship tonight | Attack story centrepiece |
| Stack patches | Next vs Express vs CF vs Supabase-aware code |
| Proof of fix | e.g. F 36 → B 78 (projected after top fixes) |
| Founder brief | Can we ship? Top risks · effort · copy to co-founder |

---

## Try live (60s)

1. https://shipcheck-two.vercel.app  
2. **Connect GitHub** (public + private repos)  
3. Pick a repo (e.g. **beforesign**) → audit runs  
4. Report: **Overview** → **Fix & PR** → **Open PR with fixes**  

Fallback without login: paste a public `owner/repo` URL.

### Flow

```
Connect GitHub → list repos (public + private) → pick one → scan
→ report (score, issues, patches) → Open fix PR
```

---

## Scoring (consistent)

**Overall = 50% Security + 30% Production + 20% Best practices**  
Security weighted highest (largest blast radius).

---

## AI fluency (hackathon)

- **Truth:** deterministic rules + repo evidence (models don’t invent vulns)  
- **Intelligence:** OpenAI for attack story, stack-aware patches, plain English, founder brief  
- **Build:** iterated with AI coding agents / Codex-class tooling during the hackathon  

---

## Stack

Next.js 16 · TypeScript · Tailwind · OpenAI · GitHub API · Vercel  

---

## Local

```bash
cd shipcheck
cp .env.example .env.local
# Set OPENAI_API_KEY=...
# For Open PR: GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET + APP_URL=http://localhost:3000
# GitHub OAuth App callback: http://localhost:3000/api/github/callback
npm i && npm run dev
```

### Vercel env (production Open PR)

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | AI narrative + patches |
| `GITHUB_CLIENT_ID` | OAuth App |
| `GITHUB_CLIENT_SECRET` | OAuth App |
| `APP_URL` | `https://shipcheck-two.vercel.app` (no trailing slash) |

OAuth App **Authorization callback URL** must be:

`https://shipcheck-two.vercel.app/api/github/callback`

---

## Don’t confuse us with

| Them | ShipCheck |
|------|-----------|
| CVE DB for security engineers | Ship / don’t ship for founders |
| Generic rate-limit snippet | Stack-detected, framework-correct patch |
| Findings list | Attack story + proof of fix + founder brief |

---

## License

MIT
