# Fragment

Authors place a link to another page, or the page path as the only text in the cell. `decorate` loads that page’s `.plain.html` and replaces the block with the fragment’s sections.

The request uses the same-origin pathname. A hash (`/fragments/legal#privacy`) or a query (`/fragments/banner?locale=fr`) still loads `/fragments/legal.plain.html` or `/fragments/banner.plain.html`. A protocol-relative path (`//other.example/...`) or a backslash path the URL parser sends to another host (`/\other.example/...`) is left unloaded.
