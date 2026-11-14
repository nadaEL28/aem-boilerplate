import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const BUTTON_BRAND_NAV = `
<div>
  <p><strong><a href="/">Acme</a></strong></p>
</div>
<div>
  <ul>
    <li>Products
      <ul><li><a href="/products/a">A</a></li></ul>
    </li>
  </ul>
</div>
<div>
  <p><a href="/search">Search</a></p>
</div>
`;

const PLAIN_BRAND_NAV = `
<div>
  <p><a href="/">Boilerplate</a></p>
</div>
<div>
  <ul>
    <li>Docs
      <ul><li><a href="/docs">Guide</a></li></ul>
    </li>
  </ul>
</div>
<div>
  <p><a href="/search">Search</a></p>
</div>
`;

function installDom() {
  const dom = new JSDOM(
    `<!DOCTYPE html><html lang="en"><head><title>Fixture</title></head><body>
      <header></header>
      <main><div><p>Hello</p></div></main>
      <footer></footer>
    </body></html>`,
    { url: 'http://localhost:3000/', pretendToBeVisual: true },
  );
  const { window } = dom;
  window.SAMPLE_PAGEVIEWS_AT_RATE = 'off';
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 900px'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Element = window.Element;
  globalThis.DocumentFragment = window.DocumentFragment;
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.DOMParser = window.DOMParser;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.Event = window.Event;
  return window;
}

function mockFetch(getNavHtml) {
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes('/nav.plain.html')) {
      return new Response(getNavHtml(), { status: 200 });
    }
    if (href.includes('/footer.plain.html')) {
      return new Response('<div><p>Footer</p></div>', { status: 200 });
    }
    return new Response('', { status: 404 });
  };
}

test('header mounts for a button brand and a plain brand', async () => {
  installDom();
  let navHtml = BUTTON_BRAND_NAV;
  mockFetch(() => navHtml);
  const { default: decorate } = await import('../blocks/header/header.js');

  const buttonBrand = document.createElement('div');
  buttonBrand.className = 'header block';
  document.body.append(buttonBrand);
  await decorate(buttonBrand);

  const buttonNav = buttonBrand.querySelector('nav');
  assert.ok(buttonNav, 'nav was not appended; decorate aborted after clearing the header');
  assert.equal(buttonNav.id, 'nav');
  const buttonBrandLink = buttonNav.querySelector('.nav-brand a');
  assert.equal(buttonBrandLink.textContent, 'Acme');
  assert.equal(buttonBrandLink.className, '');
  assert.equal(buttonBrandLink.parentElement.className, '');
  assert.equal(buttonNav.querySelector('.nav-drop > button').getAttribute('aria-expanded'), 'false');

  navHtml = PLAIN_BRAND_NAV;
  const plainBrand = document.createElement('div');
  plainBrand.className = 'header block';
  document.body.append(plainBrand);
  await decorate(plainBrand);

  const plainNav = plainBrand.querySelector('nav');
  assert.ok(plainNav);
  assert.equal(plainNav.id, 'nav');
  const plainBrandLink = plainNav.querySelector('.nav-brand a');
  assert.equal(plainBrandLink.textContent, 'Boilerplate');
  assert.equal(plainBrandLink.getAttribute('href'), '/');
  assert.equal(plainNav.querySelectorAll('.nav-drop > button').length, 1);
});
