# Widget

A paragraph whose only content is a link to `/widgets/<path>/<name>.html` becomes a widget block. `decorate` fetches that widget's HTML, CSS, and JS, then calls the widget module's default export with the block element.

Query parameters on the link are copied onto the block as data attributes before the widget script runs. `?name=World` becomes `data-name`. `?first-name=Ada` becomes `data-first-name` (`dataset.firstName`). A parameter name `dataset` cannot store does not stop the widget from loading.

CSS is scoped to `.widget`.
