# Authoring a block

A block is a folder in `blocks/`. The document supplies the markup. JavaScript only reshapes cells that are already there, and CSS only styles that block. Read `blocks/cards`, `blocks/columns`, and `blocks/hero` before you add one. Do not edit `scripts/aem.js`.

## Structure

```
blocks/<name>/
  <name>.css     required
  <name>.js      only when the DOM must change
  README.md      when behavior or the authored cells need a note
```

`loadBlock` in `scripts/aem.js` loads `blocks/<name>/<name>.css` and, when the module exists, calls its default export with the block element. `hero` is CSS only. A missing JavaScript module is caught and the block still finishes loading.

The default export is `decorate(block)`. `header` and `footer` are `async`.

Authored markup is a `div` whose first class is the block name, then rows of cells (`div` inside `div`). Authors omit and add cells. Walk the cells that exist: `columns` counts them, and `cards` turns each row into an `li`. Do not assume a fixed count.

`buildAutoBlocks` in `scripts/scripts.js` rewrites some content before your block runs (links to `/fragments/` and `/widgets/`). See the markup the pipeline actually serves:

```sh
curl -s localhost:3000/<path>.plain.html
```

`decorateBlock` adds the class `block`, `data-block-name`, a `<name>-wrapper` on the parent, and a `<name>-container` on the section. Those wrapper and container classes belong to the section. Scope CSS to `.<name>`. `hero` is the exception: `.hero-container .hero-wrapper` lets the band go full bleed.

Take helpers from `scripts/aem.js` (`createOptimizedPicture`). `blocks/fragment/fragment.js` is the only block another block may import.

## Naming

The folder, the CSS file, the JS file, and the first class on the authored `div` are the same word: lowercase, no spaces (`cards`, `columns`, `hero`).

Classes added in `decorate` start with the block name: `cards-card-image`, `cards-card-body`, `columns-img-col`, `columns-2-cols`.

## Accessibility checklist

Aim for WCAG 2.1 AA.

- **Images.** Pass the authored `alt` into `createOptimizedPicture`, as `cards` does. `alt=""` means decorative. A missing `alt` attribute fails WCAG 1.1.1. Do not remove the attribute.
- **Semantics.** Use `ul`/`li` for a group of cards, a real `button` for a control, and headings in order. Do not put a click handler on a `div`.
- **Keyboard.** Anything you can click you can operate from the keyboard. DOM order is the tab order. Do not set a positive `tabindex`. For a disclosure, dialog, or menu, follow `header`: Escape closes it and focus returns to the control that opened it.
- **Focus.** Buttons and links need a visible `:focus-visible` style. `styles/styles.css` does this for `.button`. `blocks/header/header.css` uses `outline: 2px solid currentcolor` on the nav dropdown button. Keep an outline at least that visible.
- **Contrast.** Body text uses `--text-color` (`#131313`) on `--background-color` (`white`) in `styles/styles.css`. Text needs 4.5:1 against its background. Large text and UI boundaries need 3:1. White type in `.hero` is meant to sit on a photo.
- **Motion.** This project does not animate. If you add a transition or animation, guard it with `@media (prefers-reduced-motion: reduce)` and keep a non-moving alternative.

## How to test

```sh
npm install
npx -y @adobe/aem-cli up
npm run lint
```

The dev server is <http://localhost:3000> and proxies preview content. Open a page that contains the block. Tab through every control. Confirm focus is visible, Escape closes anything you can open, and text contrast holds on the real background, including a hero photo.

`npm run lint` runs ESLint (Airbnb base; `.js` imports keep the extension) and Stylelint. CI runs that check on the pull request.

In the pull request, follow `.github/pull_request_template.md`. Include the preview URL `https://<branch>--<repo>--<owner>.aem.page/<path>`, what you clicked or tabbed through, and the contrast result. Update `blocks/<name>/README.md` when behavior or the authored cells change.
