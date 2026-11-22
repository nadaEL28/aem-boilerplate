/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/** Fragment roots currently being decorated, keyed to the paths that loaded them. */
const ancestorsByMain = new WeakMap();

/**
 * Pathname used to detect a fragment that includes itself.
 * @param {string} path Fragment path or URL
 * @returns {string}
 */
function fragmentPathname(path) {
  try {
    return new URL(path, window.location.href).pathname;
  } catch {
    return '';
  }
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @param {string[]} [ancestors] Paths of fragments already being loaded.
 * When `path` is one of them, this include is a cycle and is not fetched.
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path, ancestors = []) {
  const key = fragmentPathname(path);
  const chain = ancestors.map((item) => fragmentPathname(item)).filter(Boolean);
  // A fragment that links back to itself (or to a parent in the chain) would
  // otherwise schedule another fetch after this one resolves, with no stack
  // left to notice the loop.
  if (key && chain.includes(key)) return null;

  if (path && path.startsWith('/') && !path.startsWith('//')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      const nextAncestors = [...chain, key];
      ancestorsByMain.set(main, nextAncestors);
      decorateMain(main, { ancestors: nextAncestors });
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const host = block.closest('main');
  const ancestors = host ? ancestorsByMain.get(host) || [] : [];
  const fragment = await loadFragment(path, ancestors);
  if (!fragment) return;

  const wrapper = block.closest('.fragment-wrapper');
  const section = wrapper.closest('.section');

  if (section && section.children.length === 1) {
    // fragment is the ONLY child of its section; replace the whole section
    section.replaceWith(...fragment.childNodes);
  } else {
    // fragment shares section with other children; flatten children into it
    fragment.querySelectorAll(':scope > .section').forEach((fragSection) => {
      [...fragSection.childNodes].forEach((child) => wrapper.before(child));
    });
    wrapper.remove();
  }
}
