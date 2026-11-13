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

function setReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

function promoBannerBlock() {
  const block = document.createElement('div');
  block.className = 'promo-banner block';
  block.dataset.blockName = 'promo-banner';
  block.innerHTML = `
    <div>
      <div>
        <picture>
          <img src="/media_winter.jpg" alt="Snowy storefront with a winter sale sign">
        </picture>
      </div>
    </div>
    <div>
      <div>
        <h2>Winter sale</h2>
        <p>Save 20% through the season.</p>
        <p><a href="/sale">Shop the sale</a></p>
      </div>
    </div>
    <div>
      <div>2099-01-01T00:00:00Z</div>
    </div>
  `;
  return block;
}

function stopCountdown(block) {
  const pause = block.querySelector('.promo-banner-pause');
  if (pause && !pause.hidden && pause.getAttribute('aria-pressed') !== 'true') pause.click();
}

test('promo banner keeps authored alt and passes WCAG checks that run in jsdom', async () => {
  installDom('');
  setReducedMotion(true);
  const block = promoBannerBlock();
  const { default: decorate } = await import('../blocks/promo-banner/promo-banner.js');
  document.body.append(block);
  decorate(block);

  const img = block.querySelector('img');
  assert.equal(img.getAttribute('alt'), 'Snowy storefront with a winter sale sign');
  assert.equal(block.getAttribute('role'), 'region');
  assert.equal(block.getAttribute('aria-labelledby'), block.querySelector('h2').id);
  assert.equal(block.querySelector('.promo-banner-timer').getAttribute('aria-hidden'), 'true');
  assert.equal(block.querySelector('.promo-banner-timer').hidden, true);
  assert.equal(block.querySelector('.promo-banner-pause').hidden, true);
  assert.match(block.querySelector('.promo-banner-deadline').textContent, /^Offer ends /);
  assert.ok(block.querySelector('.promo-banner-deadline time').dateTime);

  const controls = [...block.querySelectorAll('a, button')];
  const linkIndex = controls.indexOf(block.querySelector('a'));
  const pauseIndex = controls.indexOf(block.querySelector('.promo-banner-pause'));
  assert.ok(linkIndex >= 0 && linkIndex < pauseIndex);
  [...block.querySelectorAll('[tabindex]')].forEach((el) => {
    assert.ok(Number(el.getAttribute('tabindex')) <= 0);
  });

  const results = await axe.run(block, JSDOM_AXE_OPTIONS);
  assert.equal(results.violations.length, 0, violationSummary(results));
});

test('promo banner preserves an empty alt and a missing alt', async () => {
  installDom('');
  setReducedMotion(true);
  const { default: decorate } = await import('../blocks/promo-banner/promo-banner.js');

  const decorative = document.createElement('div');
  decorative.innerHTML = `
    <div><div><picture><img src="/media_winter.jpg" alt=""></picture></div></div>
    <div><div><p>Seasonal note</p></div></div>
  `;
  document.body.append(decorative);
  decorate(decorative);
  assert.equal(decorative.querySelector('img').getAttribute('alt'), '');
  assert.equal(decorative.querySelector('[role="region"]'), null);

  const missing = document.createElement('div');
  missing.innerHTML = `
    <div><div><picture><img src="/media_winter.jpg"></picture></div></div>
    <div><div><p>Seasonal note</p></div></div>
  `;
  document.body.append(missing);
  decorate(missing);
  assert.equal(missing.querySelector('img').hasAttribute('alt'), false);
});

test('promo banner countdown can be paused and an ended offer does not tick', async () => {
  installDom('');
  setReducedMotion(false);
  const intervals = [];
  const originalSet = window.setInterval;
  const originalClear = window.clearInterval;
  window.setInterval = (fn, ms) => {
    const id = originalSet.call(window, fn, ms);
    intervals.push(id);
    return id;
  };
  const cleared = [];
  window.clearInterval = (id) => {
    cleared.push(id);
    return originalClear.call(window, id);
  };

  const { default: decorate } = await import('../blocks/promo-banner/promo-banner.js');
  const block = promoBannerBlock();
  document.body.append(block);
  try {
    decorate(block);
    assert.equal(intervals.length, 1);
    const pause = block.querySelector('.promo-banner-pause');
    assert.equal(pause.type, 'button');
    assert.equal(pause.textContent, 'Pause countdown');
    pause.click();
    assert.equal(pause.getAttribute('aria-pressed'), 'true');
    assert.equal(pause.textContent, 'Resume countdown');
    assert.deepEqual(cleared, intervals);

    const ended = document.createElement('div');
    ended.innerHTML = `
      <div><div><h2>Archive</h2><p>Past promotion.</p></div></div>
      <div><div><time datetime="2000-01-01T00:00:00Z">January 1, 2000</time></div></div>
    `;
    document.body.append(ended);
    const before = intervals.length;
    decorate(ended);
    assert.equal(intervals.length, before);
    assert.equal(ended.querySelector('.promo-banner-deadline').textContent, 'This offer has ended.');
    assert.equal(ended.querySelector('.promo-banner-pause').hidden, true);
  } finally {
    stopCountdown(block);
    window.setInterval = originalSet;
    window.clearInterval = originalClear;
  }
});
