# Authoring a new block

This guide describes how blocks work in this repository. It follows the patterns in `blocks/cards`, `blocks/hero`, `blocks/columns`, `blocks/header`, `blocks/footer`, `blocks/fragment`, and `blocks/widget`, and the rules in `.cursor/rules/`.

## Folder structure and naming

- Put the block in **`blocks/<name>/`**. The folder name is the block name and must match the first class on the block element in authored markup (for example `cards`, `hero`, `columns`).
- **Required:** `blocks/<name>/<name>.css` — loaded automatically for every block.
- **Optional:** `blocks/<name>/<name>.js` — add JavaScript only when the DOM must change. `hero` is CSS-only; `loadBlock` in `scripts/aem.js` imports the module and catches a missing file.
- **Recommended when you change behavior:** `blocks/<name>/README.md` — document authored markup and what `decorate` does (see `blocks/cards/README.md`).

Do not edit **`scripts/aem.js`** (vendored). Use exports from `/scripts/` (for example `createOptimizedPicture`, `loadCSS`).

## Authored markup

Content from the backend arrives as **rows of cells**: nested `div` elements inside the block. Authors may omit or add cells. **`decorate` must read whatever is present** — do not assume a fixed row or column count. `columns` counts cells per row; `cards` turns each row into an `li`.

Before your `decorate` runs, **`decorateBlock`** (in `scripts/aem.js`) already:

- Adds class `block`, `data-block-name`, and `data-block-status`
- Wraps text nodes for styling
- Adds **`<name>-wrapper`** on the block’s parent and **`<name>-container`** on the section

Inspect real markup with the dev server: `curl http://localhost:3000/<path>.plain.html`.

## The `decorate()` pattern

- The JS entry is a **default export** conventionally named **`decorate(block)`** (parameter name may vary; `widget` uses `widget`).
- **Sync** is fine for simple DOM rewrites (`cards`, `columns`). Use **`async decorate`** when you load fragments or other assets (`header`, `footer`, `fragment`, `widget`).
- Import other blocks only from **`blocks/fragment/fragment.js`** (`loadFragment`). Everything else comes from **`/scripts/`**.
- Prefix classes you add in JS with the block name: `cards-card-image`, `columns-2-cols`, `columns-img-col`.
- `header` and `footer` load fragment paths from metadata (`getMetadata('header' | 'footer')`) with fallbacks `/nav` and `/footer` — use that pattern only for those blocks.

Minimal sync example (`columns`):

```js
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  // …walk cells defensively
}
```

## CSS scoping

- Scope block styles to **`.<name>`** (`.cards`, `.hero`, `.columns`). Wrapper/container classes (`<name>-wrapper`, `<name>-container`) belong to the section system — style the block root, not the page shell, unless you are matching an existing exception.
- **`hero`** is the stock exception: it targets `.hero-container .hero-wrapper` so the band can go full bleed.
- Lint: `npm run lint` runs ESLint on `.js`/`.mjs` and Stylelint on `blocks/**/*.css` and `styles/*.css`.

## WCAG 2.1 AA checklist

Use this before you ship a block change. Automated coverage is **`npm test`** (axe-core, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`). **jsdom does not measure contrast** — verify contrast manually.

| Topic | What to do |
| --- | --- |
| **Alt text** | Informative images need meaningful `alt`. Decorative images use `alt=""`. When using `createOptimizedPicture`, pass the author’s alt through; do not drop the attribute (missing `alt` fails WCAG 1.1.1). |
| **Focus** | DOM order is tab order. No positive `tabindex`. Buttons and links need a visible **`:focus-visible`** style (`styles/styles.css`, `blocks/header/header.css`). |
| **Contrast** | Body text targets ≥ **4.5:1**; large text and UI boundaries ≥ **3:1**. Hero white type is for photos — do not reuse that white on white sections. |
| **Motion** | No motion in the boilerplate today. New animation must respect **`prefers-reduced-motion: reduce`**. |
| **Semantics** | Use `ul`/`li` for card lists, real **`button`** elements for controls, headings in order — not clickable `div`s. |
| **Keyboard** | Anything clickable works from the keyboard. For menus/dialogs, follow `header`: Escape closes and focus returns to the control that opened it. |

## How to test

1. **`npm install`** (once).
2. **`npm run lint`** — must exit 0 before you open a PR.
3. **`npm test`** — axe fixtures in `test/a11y.test.mjs`; add or extend a fixture when your block adds meaningful DOM or a11y surface.
4. **Dev server:** `npx -y @adobe/aem-cli up` — local code at `http://localhost:3000`, preview content proxied. Exercise the block on a real page; tab through controls and check focus visibility.
5. **Definition of done** (`.cursor/rules/definition-of-done.mdc`): update the block README when behavior changes; include a screenshot or recording and a short “how I verified” note on the PR. Open PRs against **`nadaEL28/aem-boilerplate`**, base **`main`**, with a **`{branch}--{repo}--{owner}.aem.page/`** test URL.

Further reading: [Markup, sections, blocks](https://www.aem.live/developer/markup-sections-blocks), repository `AGENTS.md`, and `.cursor/rules/block-conventions.mdc`.
