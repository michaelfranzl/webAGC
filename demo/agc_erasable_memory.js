// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import { createChild } from './lib/dom_utils.js';
import registerSpec from './register_spec.js';

const numBanks = 8;
const numRows = 32;
const numWordsPerRow = 8;

export default class AGCErasableMemory extends HTMLElement {
  #valueEls = [];

  #renderCount = 0;

  constructor() {
    super();
    this.rootEl = this.attachShadow({ mode: 'closed' });

    createChild(this.rootEl, 'link', {
      attributes: {
        rel: 'stylesheet',
        href: new URL('agc_erasable_memory.css', import.meta.url),
      },
    });

    this.#valueEls = new Array(numWordsPerRow * numRows * numBanks);
  }

  set memory(memory) {
    this.mem = memory;
    this.memLength = this.mem.length;
  }

  disconnectedCallback() {
    this.stop();
  }

  connectedCallback() {
    const type = this.getAttribute('data-type');

    for (let bankIdx = 0; bankIdx < numBanks; bankIdx++) {
      const bankEl = createChild(this.rootEl, 'div', { classes: ['bank'] });
      const headingEl = createChild(bankEl, 'h3');
      headingEl.innerHTML = `BANK ${parseInt(bankIdx, 8)}`;
      const registerDescriptionEl = createChild(bankEl, 'p', { classes: ['register_label'] });

      // Create header row
      const headerRow = createChild(bankEl, 'div');
      createChild(headerRow, 'div', { classes: ['erasable_row_label'] }); // top left spacer
      for (let colIdx = 0; colIdx < numWordsPerRow; colIdx++) {
        const colHeader = createChild(headerRow, 'div', { classes: ['col_header'] });
        colHeader.innerHTML = colIdx;
      }

      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const rowEl = createChild(bankEl, 'div');
        const rowLabelEl = createChild(rowEl, 'div', { classes: ['erasable_row_label'] });
        rowLabelEl.innerText = `0${rowIdx.toString(8)}`.slice(-2);

        for (let wordIdx = 0; wordIdx < numWordsPerRow; wordIdx++) {
          const address = bankIdx * numRows * numWordsPerRow + rowIdx * numWordsPerRow + wordIdx;
          const addressOctal = `00${address.toString(8)}`.slice(-3);
          const label = registerSpec[type][address];
          const wordElClasses = ['word'];

          if (label)
            wordElClasses.push('special_register');

          const wordEl = createChild(rowEl, 'div', {
            id: `address_${addressOctal}`,
            classes: wordElClasses,
          });

          wordEl.addEventListener('mouseover', () => {
            if (!label)
              return;

            registerDescriptionEl.innerText = `${label.short}: ${label.long}`;
          });

          if (label) {
            const labelEl = createChild(wordEl, 'label');
            labelEl.innerHTML = label.short;
          }

          const valueEl = createChild(wordEl, 'div', { classes: ['value'] });
          let text = address ? '.....' : '......'; // Dots mean uninitialized. Accumulator is 16 bits
          if (address === 7) text = '00000'; // ZEROS register is initialized in hardware
          const textEl = document.createTextNode(text);
          textEl.textContent = text;
          valueEl.appendChild(textEl);
          textEl.wordValue = 0; // this needs to be fast; HTML attribute would be pointless
          this.#valueEls[address] = textEl;
        }
      }
    }
  }

  stop() {
    this.stopping = true;
  }

  render() {
    if (this.stopping )
      return;

    window.requestAnimationFrame(() => this.render());

    if (this.#renderCount++ % 3)
      return;

    for (let idx = 0; idx < this.memLength; idx++) {
      const wordEl = this.#valueEls[idx];
      const val = this.mem[idx];
      if (wordEl.wordValue === val) continue; // Skip unnecessary expensive DOM updates.

      wordEl.wordValue = val;
      const octalValue = `00000${val.toString(8)}`;
      const width = idx ? -5 : -6;
      wordEl.textContent = octalValue.slice(width);
    }
  }
}

customElements.define('agc-erasable-memory', AGCErasableMemory);
