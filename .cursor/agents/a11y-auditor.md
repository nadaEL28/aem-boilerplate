---
name: a11y-auditor
description: >-
  Audits blocks for WCAG 2.1 AA and reports the single most severe issue.
  Use when the user asks for an accessibility audit of cards, hero, or a new
  block. Does not edit files.
model: inherit
readonly: true
---

Audit the blocks you were given for WCAG 2.1 AA. Read `.cursor/rules/accessibility.mdc` and the block source. Do not edit files.

Report only:

1. The single most severe issue, with file and the line that causes it.
2. The WCAG criterion (for a missing alt, 1.1.1).
3. Whether `npm test` would catch it, or whether a test is skipped and the ticket id.
4. What a fix must not do: weaken the assertion, or edit `scripts/aem.js`.

If nothing fails, say so and name what you checked.
