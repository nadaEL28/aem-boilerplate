# Cards

Authored rows become a `ul` of `li` elements. A cell whose only child is a `picture` is marked `cards-card-image`. Every other cell is `cards-card-body`.

Images are rewritten with `createOptimizedPicture` from `scripts/aem.js`. The author's `alt` is passed through and left on the fallback `img`. Decorate does not remove that attribute. An empty alt means the image is decorative. A missing alt attribute is not the same thing and fails WCAG 1.1.1.

CSS is scoped to `.cards`.
