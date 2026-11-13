# Promo banner

Seasonal promotion band with optional image, call to action, and an accessible countdown to the offer end.

## Authored cells

Authors add one or more rows of cells. `decorate` reads every cell in row order.

| Cell content | Result |
| --- | --- |
| Heading (`h2`–`h6`, or `h1` demoted to `h2`) | Copy in `promo-banner-body`; first heading becomes the region label via `aria-labelledby`. |
| Paragraphs and other copy | Copy cells in the body column. |
| A cell whose only child is a `picture` | Image column (`promo-banner-media`). `createOptimizedPicture` keeps the author `alt` on the fallback `img` (empty `alt` for decorative images). |
| A link (`a` or `a.button`) | Accent CTA (`promo-banner-cta`) with global `.button` focus styles plus block `:focus-visible` outline. |
| `<time datetime="ISO-8601">` | Offer end. The source cell is hidden; a `role="timer"` line with `aria-live="polite"` shows time remaining, or a static end date when `prefers-reduced-motion: reduce` is set. |

If the countdown passes, the timer text becomes “This offer has ended” and the CTA is marked `aria-disabled="true"`.

## Accessibility

- Region landmark with labelled heading; DOM order is tab order (no positive `tabindex` except `tabindex="-1"` on an expired CTA).
- Text uses `--text-color` on `--light-color` for contrast.
- Reduced motion: no countdown interval; users see a fixed end date string instead.

## Example markup (plain)

```html
<div>
  <div>
    <h2>Winter sale</h2>
  </div>
  <div>
    <p>Save on annual plans through the holidays.</p>
  </div>
  <div>
    <picture>
      <img src="/media_promo.jpg" alt="Gift boxes with snowflakes">
    </picture>
  </div>
  <div>
    <p><a href="/pricing" class="button accent">View plans</a></p>
  </div>
  <div>
    <p><time datetime="2026-12-31T23:59:59">December 31, 2026</time></p>
  </div>
</div>
```

CSS is scoped to `.promo-banner`.
