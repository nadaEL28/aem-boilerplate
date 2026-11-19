import { loadCSS } from '../../scripts/aem.js';

/**
 * Parses a widget href into folder path and name.
 * @param {string} pathname URL pathname (e.g. `/widgets/path1/name.html`)
 * @returns {{ widgetPath: string, widgetName: string }}
 */
function parseWidgetHref(pathname) {
  const pathSegments = pathname.split('/').filter((p) => p);
  const widgetName = pathSegments[pathSegments.length - 1].split('.')[0];
  const widgetPath = pathSegments.slice(1, -1).join('/');
  return { widgetPath, widgetName };
}

/**
 * Builds a widget asset URL.
 * @param {string} widgetPath Folder path under `/widgets/`
 * @param {string} widgetName Widget file name without extension
 * @param {string} extension File extension (`html`, `css`, `js`)
 */
function widgetUrl(widgetPath, widgetName, extension) {
  const prefix = widgetPath ? `${widgetPath}/` : '';
  return `${window.hlx.codeBasePath}/widgets/${prefix}${widgetName}.${extension}`;
}

/**
 * Copies one widget query param onto a data attribute.
 * `name` becomes `data-name`. `first-name` becomes `data-first-name`.
 * `dataset[key]` throws on kebab-case, and that throw used to abort loading.
 * @param {Element} widget The widget block element
 * @param {string} key Query parameter name
 * @param {string} value Query parameter value
 */
function assignWidgetParam(widget, key, value) {
  try {
    widget.dataset[key] = value;
  } catch {
    // dataset rejects kebab-case (`first-name` throws SyntaxError).
    const attrName = `data-${String(key).toLowerCase()}`;
    if (!/^data-[a-z0-9_.-]+$/.test(attrName)) return;
    try {
      widget.setAttribute(attrName, value);
    } catch {
      // Key is not a legal attribute name. Skip this param only.
    }
  }
}

/**
 * Applies widget metadata, block classes, and section shell classes.
 * Must run before widget HTML/JS load so decorate can read config from the DOM.
 * @param {Element} widget The widget block element
 * @param {HTMLAnchorElement} source The authored widget link
 * @param {string} widgetName Widget file name without extension
 * @param {URLSearchParams} searchParams Query params from the widget href
 */
function applyWidgetShell(widget, source, widgetName, searchParams) {
  widget.classList.add(widgetName);
  widget.classList.remove('block');
  widget.dataset.source = source.href;
  searchParams.forEach((value, key) => {
    assignWidgetParam(widget, key, value);
  });

  const wrapper = widget.closest('.widget-wrapper');
  if (wrapper) {
    wrapper.classList.add(`${widgetName}-wrapper`);
    wrapper.classList.remove('widget-wrapper');
  }
  const container = widget.closest('.widget-container');
  if (container) {
    container.classList.add(`${widgetName}-container`);
    container.classList.remove('widget-container');
  }
}

/**
 * Loads and decorates a widget block.
 * @param {Element} widget The widget block element
 */
export default async function decorate(widget) {
  const source = widget.querySelector('a[href]');
  const { pathname, searchParams } = new URL(source.href);
  const { widgetPath, widgetName } = parseWidgetHref(pathname);

  try {
    applyWidgetShell(widget, source, widgetName, searchParams);

    const resp = await fetch(widgetUrl(widgetPath, widgetName, 'html'));
    widget.innerHTML = await resp.text();

    const cssLoaded = loadCSS(widgetUrl(widgetPath, widgetName, 'css'));
    const decorationComplete = (async () => {
      const mod = await import(widgetUrl(widgetPath, widgetName, 'js'));
      if (mod.default) await mod.default(widget);
    })();
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`failed to load widget ${widgetPath}/${widgetName}`, error);
  }
}
