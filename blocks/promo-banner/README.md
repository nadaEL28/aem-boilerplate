# Promo banner

A responsive promotion: optional image, body copy, call to action, and an optional offer end. CSS is scoped to `.promo-banner`.

## Authored cells

Rows are cells, and authors can omit any of them. `decorate` classifies each cell:

| Cell | Becomes | Rule |
| --- | --- | --- |
| Picture only | `promo-banner-image` | The cell has a `picture` and no other text. |
| ISO-8601 instant only | Countdown | The cell text, or a single `time[datetime]`, matches `YYYY-MM-DD` or a full ISO-8601 datetime, and the cell has no link, heading, list, or picture. A date-only value is UTC midnight. |
| Anything else | `promo-banner-body` | Headings, paragraphs, and links stay in authored order. |

Example:

| Promo banner | |
| --- | --- |
| image with alt | |
| ## Winter sale | |
| Save 20% through the season. | |
| **[Shop the sale](https://example.com)** | |
| 2026-12-01T00:00:00Z | |

A strong or emphasis link is still turned into a `.button` by `decorateButtons` in `scripts/scripts.js`.

## Accessibility

- **Alt text.** Images are rewritten with `createOptimizedPicture`. The fallback `img` keeps the authored `alt`, including `alt=""`. A missing `alt` stays missing so it can fail WCAG 1.1.1 instead of being treated as decorative.
- **Focus order.** DOM order is the tab order: links in the body, then the pause button. The block does not set a positive `tabindex`. Links and buttons use a `2px` solid `--text-color` outline on `:focus` (`#131313` on `#f8f8f8`, about 17:1).
- **Contrast.** Copy uses `--text-color` (`#131313`) on `--light-color` (`#f8f8f8`), about 17:1. Timer borders use `--dark-color` (`#505050`) on white, about 7:1. The accent bar uses `--link-color` (`#3b63fb`) on `#f8f8f8`, about 4.7:1.
- **Countdown.** The end date is a `<time>` inside “Offer ends …”. The ticking numbers are `aria-hidden` so a screen reader is not interrupted every second. The pause button stops and resumes the updates (WCAG 2.2.2). When the offer ends, the text becomes “This offer has ended.” and, if the pause button had focus, focus moves to that message.
- **Reduced motion.** `prefers-reduced-motion: reduce` hides the timer and the pause button and does not start the interval. The end date stays on screen as the non-moving alternative.
- **Name.** When the body has a heading, the block is a `region` labelled by that heading.

## Responsive

Below 900px the image stacks above the copy. At 900px and up, the image sits beside the copy.
