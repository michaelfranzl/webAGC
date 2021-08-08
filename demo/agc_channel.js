// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import { createChild } from './lib/dom_utils.js';
import channelSpec from './channel_spec.js';

export default class AGCChannel extends HTMLElement {
  #bitEls = new Array(15);

  #updateBitTimeout = null;

  constructor() {
    super();
    this.rootEl = this.attachShadow({ mode: 'closed' });

    createChild(this.rootEl, 'link', {
      attributes: {
        rel: 'stylesheet',
        href: new URL('agc_channel.css', import.meta.url),
      },
    });
  }

  connectedCallback() {
    const type = this.getAttribute('data-type');
    const channel = parseInt(this.getAttribute('data-channel'), 10);
    for (let i = 0; i < 15; i++) {
      const rowEl = createChild(this.rootEl, 'div', { classes: ['row'] });
      const numberEl = createChild(rowEl, 'small');
      numberEl.innerHTML = (i + 1).toString().padStart(2, '0');
      const bitEl = createChild(rowEl, 'div', { classes: ['bit'] });
      const labelEl = createChild(rowEl, 'label');
      this.#bitEls[i] = bitEl;

      if (this.getAttribute('data-direction') === 'input') {
        rowEl.addEventListener('mousedown', () => this.#toggleBit(i));
        rowEl.addEventListener('mouseup', () => this.#toggleBit(i));
        rowEl.addEventListener('dblclick', () => this.#toggleBit(i));
      }
      labelEl.innerHTML = channelSpec[type][channel].labels[i];
    }
  }

  attributeChangedCallback(attrName, _, newVal) {
    if (attrName === 'data-state') {
      this.value = parseInt(newVal, 2);

      if (this.#updateBitTimeout)
        return;

      this.#updateBitTimeout = setTimeout(() => {
        this.#updateBitTimeout = null;
        this.#updateBits();
      }, 20); // limit maximum DOM update frequency

      this.#updateBits();
    }
  }

  #toggleBit(bitNumber) {
    this.value ^= 1 << bitNumber;
    this.setAttribute('data-state', this.value.toString(2).padStart(15, '0'));
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }));
  }

  #updateBits() {
    for (let i = 0; i < 15; i++)
      this.#bitEls[i].setAttribute('data-value', !!(this.value & 1 << i));
  }

  static get observedAttributes() {
    return ['data-state'];
  }
}

customElements.define('agc-channel', AGCChannel);
