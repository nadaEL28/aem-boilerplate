---
name: author-block
description: >-
  Adds an Edge Delivery block under blocks/ using this repo's decorate
  pattern, CSS scoping, WCAG 2.1 AA, and README. Use when the user asks to
  create or author a block, including a promo banner.
disable-model-invocation: true
---

# Author a block

1. Read one existing block before writing. `cards` has a script. `hero` is CSS only.
2. Create `blocks/<name>/<name>.js` only if the DOM must change. `<name>.css` is required when the block has its own layout. `<name>` is the folder name.
3. Default-export `decorate(block)`. Read the cells that exist. Authors omit cells. Do not assume a fixed count.
4. Scope CSS to `.<name>`. Do not style `.block` or section wrappers, except the existing hero full-bleed exception.
5. Prefix classes you add with the block name (`promo-banner-media`).
6. Import only `fragment` across blocks. Everything else comes from `/scripts/`. Do not edit `scripts/aem.js`.
7. Images: pass the authored alt into `createOptimizedPicture`. Do not call `removeAttribute('alt')`. Decorative images use `alt=""`.
8. Controls: DOM order is tab order. No positive `tabindex`. Visible `:focus-visible`. If anything moves, guard it with `prefers-reduced-motion: reduce`.
9. Do not assign `innerHTML` from author or fetched HTML.
10. Add `blocks/<name>/README.md` with the authored cells and the accessibility contract.
11. Add or extend a test in `test/a11y.test.mjs`. Run `npm run lint` and `npm test`. Both must exit 0.
12. Open the pull request on `nadaEL28/aem-boilerplate`, base `main`. Include a screenshot or recording and a short "how I verified" note.
