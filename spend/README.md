# Spend

Internal dashboard for this month's AI and GitHub consumption.

The top meters are the same remaining/used percentages as:

- grok.com Settings > Usage (weekly SuperGrok pool, Grok Build, extra credits, banked resets)
- Claude Code Settings > Usage (current session, weekly all-models)
- Codex / ChatGPT usage window

Refresh everything (Actions + sessions + plan bars):

```bash
python3 ~/.grok/scripts/collect-spend.py
```

Refresh only the product usage bars (seconds, not minutes):

```bash
python3 ~/.grok/scripts/collect-spend.py --plan-only
```

Then commit `data.json` in this folder.
