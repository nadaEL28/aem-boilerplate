# Cards

Authored rows become a `ul` of `li` elements. A cell whose only child is a `picture` is marked `cards-card-image`. Every other cell is `cards-card-body`.

Images are rewritten with `createOptimizedPicture` from `scripts/aem.js`. The fallback `img` keeps the author's `alt`. An empty alt means the image is decorative. A missing alt attribute is not the same thing and fails WCAG 1.1.1.

CSS is scoped to `.cards`.
