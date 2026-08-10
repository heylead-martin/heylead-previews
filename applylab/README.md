# ApplyLab (preview)

Personal remote job co-pilot.

**URL:** https://previews.heylead.com/applylab/

**API:** `~/applylab-api` → https://applylab-api.martin-656.workers.dev

## First-time setup

1. Open ApplyLab → **Settings**
2. Worker URL is prefilled: `https://applylab-api.martin-656.workers.dev`
3. Paste **APP_TOKEN** from `~/applylab-api/.app-token-local.txt` (local only, not in git)
4. Save & test until status shows connected
5. Fill **Profile** (resume text + skills + target roles)
6. **Job feed** → pick a role → **AI tailor materials**

### Enable AI tailoring

```bash
cd ~/applylab-api
npx wrangler secret put XAI_API_KEY   # from https://console.x.ai
```

Without this, jobs/match/tracker still work; only `/api/tailor` needs xAI.

## Scope (v1)

| Included | Not yet |
|----------|---------|
| Remote FT job feed (Remotive, Jobicy, RemoteOK) | True auto-submit bots |
| Heuristic match scoring | Interview buddy |
| AI resume + cover letter (xAI) | Multi-user public SaaS |
| Application tracker | ATS PDF export pack |

Semi-auto: ApplyLab prepares materials and opens the listing; you submit on the board, then mark status in Tracker.
