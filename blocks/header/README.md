# Header

The header loads `/nav`, or the path in the `nav` metadata, as a fragment. The first three sections become brand, sections, and tools.

A brand link decorated as a button (bold or italic in the document) is unwrapped back into a plain link. `decorateButtons` marks that paragraph `button-wrapper` and the anchor `button`. Those classes are removed so the logo is not a pill and header decoration can finish.

A section item that contains a nested list becomes a dropdown. The label is a `button` with `aria-expanded`. Escape closes the open dropdown on desktop and the whole menu on smaller viewports.

CSS is scoped to `header`.
