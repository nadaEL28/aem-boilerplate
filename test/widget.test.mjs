import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body></body></html>',
    { url: 'http://localhost:3000/', pretendToBeVisual: true },
  );
  const { window } = dom;
  window.SAMPLE_PAGEVIEWS_AT_RATE = 'off';
  window.hlx = { codeBasePath: '' };
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Element = window.Element;
  globalThis.DocumentFragment = window.DocumentFragment;
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.DOMParser = window.DOMParser;
  globalThis.fetch = async (url) => ({
    ok: true,
    text: async () => `<p class="greeting">Hello <span class="name">world</span></p><!-- ${url} -->`,
  });
  // jsdom never fires stylesheet load. Resolve loadCSS as soon as the link is added.
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

test('widget decorate keeps kebab-case query params and still loads', async () => {
  const { document } = installDom();
  const block = document.createElement('div');
  block.className = 'widget block';
  block.innerHTML = '<div><div>'
    + '<a href="/widgets/hello-world/hello-world.html?first-name=Ada&name=World&a%20b=skip">Hello</a>'
    + '</div></div>';
  const wrapper = document.createElement('div');
  wrapper.className = 'widget-wrapper';
  const container = document.createElement('div');
  container.className = 'section widget-container';
  wrapper.append(block);
  container.append(wrapper);
  document.body.append(container);

  const { default: decorate } = await import('../blocks/widget/widget.js');
  // aem.js setup() replaces codeBasePath. Point widget imports at the fixture module.
  window.hlx.codeBasePath = fileURLToPath(new URL('./fixtures', import.meta.url));
  await decorate(block);

  assert.equal(block.dataset.firstName, 'Ada');
  assert.equal(block.dataset.name, 'World');
  assert.equal(block.getAttribute('data-first-name'), 'Ada');
  assert.equal(block.dataset.source.includes('first-name=Ada'), true);
  assert.equal(block.querySelector('.greeting').textContent, 'Hello Ada');
  assert.equal(block.classList.contains('hello-world'), true);
  assert.equal(block.classList.contains('block'), false);
  assert.equal(wrapper.classList.contains('hello-world-wrapper'), true);
  assert.equal(container.classList.contains('hello-world-container'), true);
});
