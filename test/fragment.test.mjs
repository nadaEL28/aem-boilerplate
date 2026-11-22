import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const counts = new Map();

function installDom() {
  const dom = new JSDOM(
    `<!DOCTYPE html><html lang="en"><head><title>Fixture</title></head><body>
      <header></header>
      <main><div><p>Home</p></div></main>
      <footer></footer>
    </body></html>`,
    { url: 'http://localhost:3000/page', pretendToBeVisual: true },
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
  // jsdom never fires stylesheet load. loadBlock waits on it.
  const observer = new window.MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.tagName === 'LINK' && typeof node.onload === 'function') node.onload();
      });
    });
  });
  observer.observe(window.document.head, { childList: true });
  return window;
}

function countOf(pathname) {
  const needle = `${pathname}.plain.html`;
  let total = 0;
  counts.forEach((n, href) => {
    if (href.includes(needle)) total += n;
  });
  return total;
}

installDom();
globalThis.fetch = async (url) => {
  const href = String(url);
  const fragmentPath = href.includes('/fragments/') ? href : '';
  if (fragmentPath) {
    const next = (counts.get(fragmentPath) || 0) + 1;
    counts.set(fragmentPath, next);
    if (next > 6) throw new Error(`runaway fetch ${fragmentPath} (${next})`);
  }
  if (href.includes('/fragments/loop.plain.html')) {
    return new Response('<div><p><a href="/fragments/loop">Loop</a></p></div>', { status: 200 });
  }
  if (href.includes('/fragments/a.plain.html')) {
    return new Response('<div><p><a href="/fragments/b">Open B</a></p></div>', { status: 200 });
  }
  if (href.includes('/fragments/b.plain.html')) {
    return new Response('<div><p><a href="/fragments/a">Open A</a></p></div>', { status: 200 });
  }
  if (href.includes('/fragments/parent.plain.html')) {
    return new Response('<div><p><a href="/fragments/child">Child</a></p></div>', { status: 200 });
  }
  if (href.includes('/fragments/child.plain.html')) {
    return new Response('<div><p>From child</p></div>', { status: 200 });
  }
  if (href.includes('/fragments/hello.plain.html')) {
    return new Response('<div><p>Hello</p></div>', { status: 200 });
  }
  if (href.includes('/fragments/block-loop.plain.html')) {
    return new Response(`
      <div>
        <div class="fragment">
          <div><p><a href="/fragments/block-loop">Again</a></p></div>
        </div>
      </div>
    `, { status: 200 });
  }
  if (href.includes('/nav.plain.html') || href.includes('/footer.plain.html')) {
    return new Response('<div><p>Chrome</p></div>', { status: 200 });
  }
  return new Response('', { status: 404 });
};

const { loadFragment } = await import('../blocks/fragment/fragment.js');
const { decorateMain } = await import('../scripts/scripts.js');

async function settle() {
  await new Promise((resolve) => { setTimeout(resolve, 80); });
}

test('a fragment that links to itself is fetched once', async () => {
  counts.clear();
  const fragment = await loadFragment('/fragments/loop');
  await settle();

  assert.equal(countOf('/fragments/loop'), 1);
  assert.equal(fragment.querySelector('a[href="/fragments/loop"]').textContent, 'Loop');
});

test('two fragments that include each other are fetched once each', async () => {
  counts.clear();
  const fragment = await loadFragment('/fragments/a');
  await settle();

  assert.equal(countOf('/fragments/a'), 1);
  assert.equal(countOf('/fragments/b'), 1);
  assert.equal(fragment.querySelector('a[href="/fragments/a"]').textContent, 'Open A');
});

test('a nested fragment still loads', async () => {
  counts.clear();
  const fragment = await loadFragment('/fragments/parent');
  await settle();

  assert.equal(countOf('/fragments/parent'), 1);
  assert.equal(countOf('/fragments/child'), 1);
  assert.equal(fragment.textContent.includes('From child'), true);
  assert.equal(fragment.querySelector('a[href="/fragments/child"]'), null);
});

test('the same fragment can be included twice when the includes are not nested', async () => {
  counts.clear();
  const main = document.createElement('main');
  main.innerHTML = `
    <div><p><a href="/fragments/hello">One</a></p></div>
    <div><p><a href="/fragments/hello">Two</a></p></div>
  `;
  document.body.append(main);
  decorateMain(main);
  await settle();

  assert.equal(countOf('/fragments/hello'), 2);
  assert.equal(main.textContent.match(/Hello/g).length, 2);
});

test('a fragment block that points at itself does not refetch', async () => {
  counts.clear();
  const fragment = await loadFragment('/fragments/block-loop');
  await settle();

  assert.equal(countOf('/fragments/block-loop'), 1);
  assert.equal(fragment.querySelector('a[href="/fragments/block-loop"]').textContent, 'Again');
});
