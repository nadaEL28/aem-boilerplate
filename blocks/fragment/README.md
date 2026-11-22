# Fragment

A fragment block loads another page and renders it in place. The link `href`, or the cell text when there is no link, is the fragment path. `loadFragment` fetches `<path>.plain.html` when the path starts with `/`.

If that fragment is the only content in its section, its sections replace the section so the fragment's section styling is kept. If the section has other content, the fragment's blocks are inserted beside it.

A link whose only content is a `/fragments/` URL is also loaded as a fragment. A fragment that includes itself, or two fragments that include each other, is not fetched again. The authored link stays on the page.

The same fragment may still be included more than once when those includes are not nested inside each other.

`loadFragment` is the only export other blocks may import.
