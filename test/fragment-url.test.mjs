import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const calls = [];

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

installDom();

globalThis.fetch = async (input) => {
  const href = String(input);
  calls.push(href);
  const parsed = new URL(href, window.location.href);
  if (parsed.origin !== window.location.origin) {
    return new Response('cross-origin', { status: 200 });
  }
  if (parsed.pathname.endsWith('.plain.html')) {
    const name = parsed.pathname.slice(1);
    return new Response(`<div><p>plain:${name}</p><img src="./media_x.png" alt=""></div>`, { status: 200 });
  }
  return new Response('<!DOCTYPE html><html><body><p>FULLPAGE</p></body></html>', { status: 200 });
};

const { loadFragment } = await import('../blocks/fragment/fragment.js');

function callsFor(pathname) {
  return calls.filter((href) => {
    const parsed = new URL(href, window.location.href);
    return parsed.pathname === pathname;
  });
}

test('a fragment link with a hash still requests the plain document', async () => {
  calls.length = 0;
  const fragment = await loadFragment('/fragments/legal#privacy');
  assert.equal(callsFor('/fragments/legal.plain.html').length, 1);
  assert.equal(fragment.querySelector('p').textContent, 'plain:fragments/legal.plain.html');
  assert.equal(fragment.textContent.includes('FULLPAGE'), false);
  const img = fragment.querySelector('img');
  assert.equal(img.src, 'http://localhost:3000/fragments/media_x.png');
});

test('a fragment link with a query still requests the plain document', async () => {
  calls.length = 0;
  const fragment = await loadFragment('/fragments/banner?locale=fr');
  assert.equal(callsFor('/fragments/banner.plain.html').length, 1);
  assert.equal(calls.some((href) => href.includes('locale=fr.plain.html')), false);
  assert.equal(fragment.querySelector('p').textContent, 'plain:fragments/banner.plain.html');
});

test('a backslash path that retargets the host is not fetched', async () => {
  calls.length = 0;
  const fragment = await loadFragment('/\\evil.example/payload');
  assert.equal(fragment, null);
  assert.equal(calls.some((href) => href.includes('evil.example')), false);
});

test('a protocol-relative fragment path is not fetched', async () => {
  calls.length = 0;
  const fragment = await loadFragment('//evil.example/fragments/foo');
  assert.equal(fragment, null);
  assert.equal(calls.length, 0);
});
