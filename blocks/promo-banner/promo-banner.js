import { createOptimizedPicture } from '../../scripts/aem.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const UNITS = [
  ['days', 'days', 86400],
  ['hours', 'hours', 3600],
  ['minutes', 'minutes', 60],
  ['seconds', 'seconds', 1],
];

let titleSequence = 0;

/**
 * @param {string} value
 * @returns {number|null}
 */
function parseInstant(value) {
  const candidate = value.trim();
  if (!DATE_PATTERN.test(candidate)) return null;
  const ms = Date.parse(candidate);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * A cell is the offer end only when it contains nothing except an ISO-8601 instant.
 * @param {HTMLElement} cell
 * @returns {number|null}
 */
function readEndInstant(cell) {
  if (cell.querySelector('picture, a, h1, h2, h3, h4, h5, h6, ul, ol')) return null;
  const time = cell.querySelector('time[datetime]');
  if (time) {
    const extras = cell.textContent.replace(time.textContent, '').trim();
    if (extras) return null;
    return parseInstant(time.getAttribute('datetime') || '');
  }
  return parseInstant(cell.textContent);
}

/**
 * @param {HTMLElement} cell
 * @returns {boolean}
 */
function isPictureCell(cell) {
  if (!cell.querySelector('picture')) return false;
  const leftover = cell.cloneNode(true);
  leftover.querySelectorAll('picture').forEach((picture) => picture.remove());
  return leftover.textContent.trim() === '';
}

/**
 * Keeps a missing alt missing. createOptimizedPicture always writes an alt attribute.
 * @param {ParentNode} root
 */
function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const authoredAlt = img.getAttribute('alt');
    const optimized = createOptimizedPicture(img.src, authoredAlt ?? '', false, [{ width: '750' }]);
    const optimizedImg = optimized.querySelector('img');
    if (authoredAlt === null) optimizedImg.removeAttribute('alt');
    else optimizedImg.setAttribute('alt', authoredAlt);
    img.closest('picture').replaceWith(optimized);
  });
}

/**
 * @param {number} endMs
 * @param {number} now
 */
function remainingParts(endMs, now) {
  let rest = Math.max(0, Math.floor((endMs - now) / 1000));
  const parts = {};
  UNITS.forEach(([key, , size]) => {
    parts[key] = Math.floor(rest / size);
    rest %= size;
  });
  return parts;
}

/**
 * @param {number} endMs
 */
function formatEnd(endMs) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(endMs));
}

/**
 * @param {HTMLElement} deadline
 * @param {number} endMs
 */
function fillDeadline(deadline, endMs) {
  const time = document.createElement('time');
  time.dateTime = new Date(endMs).toISOString();
  time.textContent = formatEnd(endMs);
  deadline.replaceChildren(document.createTextNode('Offer ends '), time, document.createTextNode('.'));
}

/**
 * @param {HTMLElement} block
 * @param {number} endMs
 * @returns {DocumentFragment}
 */
function buildCountdown(block, endMs) {
  const fragment = document.createDocumentFragment();
  const deadline = document.createElement('p');
  deadline.className = 'promo-banner-deadline';
  fillDeadline(deadline, endMs);

  const timer = document.createElement('div');
  timer.className = 'promo-banner-timer';
  timer.setAttribute('aria-hidden', 'true');

  const values = {};
  UNITS.forEach(([key, label]) => {
    const part = document.createElement('span');
    part.className = 'promo-banner-timer-part';
    const value = document.createElement('span');
    value.className = 'promo-banner-timer-value';
    const unit = document.createElement('span');
    unit.className = 'promo-banner-timer-unit';
    unit.textContent = label;
    part.append(value, unit);
    timer.append(part);
    values[key] = value;
  });

  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'promo-banner-pause';
  pause.textContent = 'Pause countdown';
  pause.setAttribute('aria-pressed', 'false');

  fragment.append(deadline, timer, pause);

  const motion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  let intervalId = 0;
  let paused = false;
  let ended = false;

  const paint = () => {
    const parts = remainingParts(endMs, Date.now());
    UNITS.forEach(([key]) => {
      values[key].textContent = String(parts[key]).padStart(2, '0');
    });
  };

  const stop = () => {
    if (!intervalId) return;
    window.clearInterval(intervalId);
    intervalId = 0;
  };

  const finish = () => {
    if (ended) return;
    ended = true;
    stop();
    const returnFocus = pause.matches(':focus');
    deadline.textContent = 'This offer has ended.';
    deadline.setAttribute('aria-live', 'polite');
    timer.hidden = true;
    pause.hidden = true;
    if (returnFocus) {
      deadline.tabIndex = -1;
      deadline.focus();
    }
  };

  const start = () => {
    if (intervalId || ended || paused || motion?.matches || !block.isConnected) return;
    intervalId = window.setInterval(() => {
      if (!block.isConnected || motion?.matches) {
        stop();
        return;
      }
      if (Date.now() >= endMs) {
        finish();
        return;
      }
      paint();
    }, 1000);
  };

  const applyMotion = () => {
    const reduce = Boolean(motion?.matches);
    if (ended) return;
    timer.hidden = reduce;
    pause.hidden = reduce;
    if (reduce) stop();
    else start();
  };

  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume countdown' : 'Pause countdown';
    if (paused) stop();
    else start();
  });

  if (Date.now() >= endMs) {
    ended = true;
    deadline.textContent = 'This offer has ended.';
    timer.hidden = true;
    pause.hidden = true;
  } else {
    paint();
    applyMotion();
  }

  if (motion?.addEventListener) motion.addEventListener('change', applyMotion);

  return fragment;
}

/**
 * @param {HTMLElement} block
 */
function labelRegion(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  titleSequence += 1;
  if (!heading.id) heading.id = `promo-banner-title-${titleSequence}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-labelledby', heading.id);
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children]);
  const imageCells = [];
  const bodyCells = [];
  let endMs = null;

  cells.forEach((cell) => {
    const instant = readEndInstant(cell);
    if (instant !== null && endMs === null) endMs = instant;
    else if (isPictureCell(cell)) imageCells.push(cell);
    else bodyCells.push(cell);
  });

  const image = document.createElement('div');
  image.className = 'promo-banner-image';
  imageCells.forEach((cell) => image.append(...cell.childNodes));

  const body = document.createElement('div');
  body.className = 'promo-banner-body';
  bodyCells.forEach((cell) => body.append(...cell.childNodes));

  optimizeImages(image);
  optimizeImages(body);

  const content = document.createElement('div');
  content.className = 'promo-banner-content';
  if (body.childNodes.length) content.append(body);
  if (endMs !== null) content.append(buildCountdown(block, endMs));

  const next = [];
  if (image.childNodes.length) next.push(image);
  if (content.childNodes.length) next.push(content);
  block.replaceChildren(...next);
  labelRegion(block);
}
