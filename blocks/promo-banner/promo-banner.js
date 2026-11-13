import { createOptimizedPicture } from '../../scripts/aem.js';

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;

function prefersReducedMotion() {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function collectCells(block) {
  const cells = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => cells.push(cell));
  });
  return cells;
}

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return 'This offer has ended';
  const days = Math.floor(msRemaining / MS_PER_DAY);
  const hours = Math.floor((msRemaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((msRemaining % MS_PER_HOUR) / MS_PER_MINUTE);
  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0 || days > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  return `Offer ends in ${parts.join(', ')}`;
}

function formatEndDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function optimizeBannerImage(cell) {
  const img = cell.querySelector('picture > img, img');
  if (!img?.src) return;
  const alt = img.getAttribute('alt') ?? '';
  const optimized = createOptimizedPicture(img.src, alt, false, [{ width: '750' }, { media: '(min-width: 900px)', width: '1200' }]);
  const optimizedImg = optimized.querySelector('img');
  if (alt) optimizedImg.setAttribute('alt', alt);
  else optimizedImg.setAttribute('alt', '');
  const picture = img.closest('picture');
  if (picture) picture.replaceWith(optimized);
  else img.replaceWith(optimized);
}

function markCta(cta) {
  if (!cta.classList.contains('button')) cta.classList.add('button', 'accent');
  cta.classList.add('promo-banner-cta');
}

function setCtaExpired(cta) {
  cta.setAttribute('aria-disabled', 'true');
  cta.setAttribute('tabindex', '-1');
  cta.addEventListener('click', (event) => event.preventDefault());
}

function initCountdown(timerEl, endIso, cta) {
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) {
    timerEl.textContent = 'Offer end date is unavailable';
    timerEl.removeAttribute('role');
    return null;
  }

  const endLabel = formatEndDate(endIso);
  const update = () => {
    const remaining = end.getTime() - Date.now();
    if (remaining <= 0) {
      timerEl.textContent = 'This offer has ended';
      if (cta) setCtaExpired(cta);
      return false;
    }
    if (prefersReducedMotion()) {
      timerEl.textContent = endLabel ? `Offer ends ${endLabel}` : formatCountdown(remaining);
    } else {
      timerEl.textContent = formatCountdown(remaining);
    }
    return true;
  };

  if (!update()) return null;

  if (prefersReducedMotion()) return null;

  const intervalMs = 60_000;
  let intervalId = null;
  intervalId = window.setInterval(() => {
    if (!update()) window.clearInterval(intervalId);
  }, intervalMs);
  return intervalId;
}

export default function decorate(block) {
  const cells = collectCells(block);
  const media = document.createElement('div');
  media.className = 'promo-banner-media';

  const body = document.createElement('div');
  body.className = 'promo-banner-body';

  const timer = document.createElement('p');
  timer.className = 'promo-banner-countdown';
  timer.setAttribute('role', 'timer');
  timer.setAttribute('aria-live', 'polite');
  timer.setAttribute('aria-atomic', 'true');

  let endIso = null;
  let cta = null;
  let headingId = null;

  cells.forEach((cell) => {
    const timeEl = cell.querySelector('time[datetime]');
    const pictureOnly = cell.querySelector('picture')
      && cell.children.length === 1
      && !cell.querySelector('p, h1, h2, h3, h4, h5, h6, a');
    const link = cell.querySelector('a[href]');
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');

    const timeValue = timeEl?.getAttribute('datetime') || timeEl?.dateTime;
    if (timeValue) {
      endIso = timeValue;
      cell.classList.add('promo-banner-deadline-source');
      cell.setAttribute('hidden', '');
      return;
    }

    if (pictureOnly) {
      optimizeBannerImage(cell);
      cell.classList.add('promo-banner-image');
      media.append(cell);
      return;
    }

    if (link && cell.querySelector('p')?.textContent.trim() === link.textContent.trim()) {
      markCta(link);
      cta = link;
      cell.classList.add('promo-banner-actions');
      body.append(cell);
      return;
    }

    if (link && !heading) {
      markCta(link);
      cta = link;
      cell.classList.add('promo-banner-actions');
      body.append(cell);
      return;
    }

    if (heading) {
      if (!headingId) {
        if (heading.tagName === 'H1') {
          const h2 = document.createElement('h2');
          while (heading.firstChild) h2.append(heading.firstChild);
          heading.replaceWith(h2);
          headingId = 'promo-banner-heading';
          h2.id = headingId;
        } else {
          headingId = 'promo-banner-heading';
          heading.id = headingId;
        }
      }
    }

    cell.classList.add('promo-banner-copy');
    body.append(cell);
  });

  block.setAttribute('role', 'region');
  if (headingId) block.setAttribute('aria-labelledby', headingId);

  const inner = document.createElement('div');
  inner.className = 'promo-banner-inner';

  if (endIso) body.append(timer);
  inner.append(media, body);
  block.replaceChildren(inner);

  if (endIso) {
    const interval = initCountdown(timer, endIso, cta);
    if (interval) block.dataset.countdownInterval = String(interval);
  }
}
