# Live prompts

Paste these as written. Prompts A–C are cloud agents, launched together. Prompt D is a short local comparison across models.

`--text-color` is real: it is defined on `:root` in `styles/styles.css` and used for body text, primary and secondary buttons, and borders. Prompt D is unchanged.

## Prompt A (cloud agent, feature)

Add a new accessible "promo-banner" block following the conventions of the existing blocks (cards, hero). Requirements: WCAG 2.1 AA (focus order, contrast, alt text, reduced motion), responsive, documented in the block README. Run the linters, record a short screen recording of the block in the dev server, and open a PR with the recording attached.

## Prompt B (cloud agent, bug)

Audit the cards and hero blocks for WCAG 2.1 AA issues. Fix the single most severe issue, add a lint rule or test so it cannot regress, and explain how you verified the fix. Include evidence.

## Prompt C (cloud agent, docs)

Read the repository and write a one-page contributor guide for authoring a new block (structure, naming, a11y checklist, how to test). Open a PR.

## Prompt D (compare models, short task)

Rename the CSS custom property --text-color to --color-text everywhere and update documentation.
