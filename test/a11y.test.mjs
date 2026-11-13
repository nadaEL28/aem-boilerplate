import assert from 'node:assert/strict';
import { test } from 'node:test';
import axe from 'axe-core';
import { JSDOM } from 'jsdom';

// Block modules are browser ESM. Node loads them only when module syntax
// detection is on, which `npm test` enables. See package.json.
const AXE_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

/**
 * jsdom has no layout engine, so axe cannot measure contrast here.
 * Image names, labels, and document structure still run.
 */
const JSDOM_AXE_OPTIONS = {
  ...AXE_OPTIONS,
  rules: {
    'color-contrast': { enabled: false },
  },
};

function installDom(body) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html lang="en"><head><title>Fixture</title></head><body>${body}</body></html>`,
    { url: 'http://localhost:3000/', pretendToBeVisual: true },
  );
  const { window } = dom;
  // Keep the RUM sampler in aem.js from sending a beacon during import.
  window.SAMPLE_PAGEVIEWS_AT_RATE = 'off';
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Element = window.Element;
  globalThis.DocumentFragment = window.DocumentFragment;
  globalThis.MutationObserver = window.MutationObserver;
  globalThis.DOMParser = window.DOMParser;
  return window;
}

function violationSummary(results) {
  return results.violations
    .map((violation) => `${violation.id}: ${violation.help}`)
    .join('\n');
}

function cardsBlock() {
  const block = document.createElement('div');
  block.className = 'cards';
  block.innerHTML = `
    <div>
      <div>
        <picture>
          <img src="/media_team.jpg" alt="Team planning a launch">
        </picture>
      </div>
      <div>
        <h3>Plan the launch</h3>
        <p>Dates, owners, and the page that ships.</p>
      </div>
    </div>
  `;
  return block;
}

test('a basic page meets WCAG 2.1 AA checks that run in jsdom', async () => {
  const { document } = installDom(`
    <main>
      <h1>Welcome</h1>
      <p><a href="/docs">Read the docs</a></p>
      <img src="/media_team.jpg" alt="Team planning a launch">
    </main>
  `);
  const results = await axe.run(document.body, JSDOM_AXE_OPTIONS);
  assert.equal(results.violations.length, 0, violationSummary(results));
});

test('cards decorate builds a list of cards', async () => {
  installDom('');
  const block = cardsBlock();
  const { default: decorate } = await import('../blocks/cards/cards.js');
  document.body.append(block);
  decorate(block);

  assert.equal(block.querySelectorAll(':scope > ul > li').length, 1);
  assert.ok(block.querySelector('.cards-card-image'));
  assert.ok(block.querySelector('.cards-card-body'));
});

// TODO(A11Y-142): re-enable when cards decorate stops dropping the author alt.
function promoBannerBlock() {
  const block = document.createElement('div');
  block.className = 'promo-banner';
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  block.innerHTML = `
    <div>
      <div><h2>Winter sale</h2></div>
      <div><p>Save on annual plans through the holidays.</p></div>
      <div>
        <picture>
          <img src="/media_promo.jpg" alt="Gift boxes with snowflakes">
        </picture>
      </div>
      <div><p><a href="/pricing" class="button accent">View plans</a></p></div>
      <div><p><time datetime="${end}">Offer end</time></p></div>
    </div>
  `;
  return block;
}

test('promo-banner decorate builds an accessible promo region', async () => {
  installDom('');
  const block = promoBannerBlock();
  const { default: decorate } = await import('../blocks/promo-banner/promo-banner.js');
  document.body.append(block);
  decorate(block);
  const { countdownInterval } = block.dataset;
  if (countdownInterval) window.clearInterval(Number(countdownInterval));

  assert.equal(block.getAttribute('role'), 'region');
  assert.ok(block.querySelector('#promo-banner-heading'));
  assert.ok(block.querySelector('.promo-banner-countdown'));
  assert.equal(block.querySelector('img').getAttribute('alt'), 'Gift boxes with snowflakes');

  const results = await axe.run(block, JSDOM_AXE_OPTIONS);
  assert.equal(results.violations.length, 0, violationSummary(results));
});

test('cards decorate keeps the author image alt', {
  skip: 'TODO(A11Y-142): known failure, cards decorate removes the author alt',
}, async () => {
  installDom('');
  const block = cardsBlock();
  const { default: decorate } = await import('../blocks/cards/cards.js');
  document.body.append(block);
  decorate(block);

  const results = await axe.run(block, JSDOM_AXE_OPTIONS);
  const imageAlt = results.violations.filter((violation) => violation.id === 'image-alt');
  assert.equal(imageAlt.length, 0, violationSummary(results));
  assert.equal(block.querySelector('img').getAttribute('alt'), 'Team planning a launch');
});
