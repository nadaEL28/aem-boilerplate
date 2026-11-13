---
name: verify-block
description: >-
  Runs lint and the axe tests for a block change and writes the verification
  note. Use when the user says verify, how I verified, or before opening a
  pull request for a block.
disable-model-invocation: true
---

# Verify a block

1. Run `npm run lint`, then `npm test`. Do not skip a failing test to get green. A skipped test must name the ticket.
2. If the change is in `blocks/`, confirm `blocks/<name>/README.md` describes the cells you changed.
3. Reply with this note and nothing softer:

```
How I verified
- npm run lint: <exit code>
- npm test: <passed / failed / skipped, and any ticket id>
- What I exercised: <keyboard, axe, or the dev server>
- Evidence: <path or "not recorded">
```

4. Do not open a pull request against `adobe/aem-boilerplate`.
