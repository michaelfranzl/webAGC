// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import { createChild } from './lib/dom_utils.js';

// Labels and descriptions are according to Frank O'Brien, The Apollo Guidance Computer, Appendix C.
// Split into LM and CM labels according to my (Michael Franzl) current guesses.
const labels = {
  0o00: { short: 'A', long: 'Accumulator' },
  0o01: { short: 'L', long: 'Low order product of the Accumulator' },
  0o02: { short: 'Q', long: 'TC instruction return address' },
  0o03: { short: 'EBANK', long: 'Erasable storage banking register' },
  0o04: { short: 'FBANK', long: 'Fixed storage banking register' },
  0o05: { short: 'Z', long: '12 bit program counter' },
  0o06: { short: 'BBANK', long: 'Both Banks Register' },
  0o07: { short: 'ZERO', long: 'Hardwired to the value zero' },

  0o10: { short: 'ARUPT', long: 'Interrupted contents of A' },
  0o11: { short: 'LRUPT', long: 'Interrupted contents of L' },
  0o12: { short: 'QRUPT', long: 'Interrupted contents of Q' },
  0o13: { short: 'SAMPT1', long: 'Sampled time 1' },
  0o14: { short: 'SAMPT2', long: 'Sampled time 2' },
  0o15: { short: 'ZRUPT', long: 'Interrupted contents of Z (hardware)' },
  0o16: { short: 'BANKRUPT', long: 'Interrupted contents of BBANK' },
  0o17: { short: 'BRUPT', long: 'Interrupted contents of B internal register' },

  0o20: { short: 'CYR', long: 'Cycle Right' },
  0o21: { short: 'SR', long: 'Shift Right' },
  0o22: { short: 'CYL', long: 'Cycle Left' },
  0o23: { short: 'EDOP', long: 'Edits Interpretative Operation Code Pairs' },
  0o24: { short: 'TIME2', long: 'Elapsed time 2' },
  0o25: { short: 'TIME1', long: 'Elapsed time 1' },
  0o26: { short: 'TIME3', long: 'T3RUPT: Wait list' },
  0o27: { short: 'TIME4', long: 'T4RUPT' },

  0o30: { short: 'TIME5', long: 'T5RUPT: Digital Autopilot' },
  0o31: { short: 'TIME6', long: 'T6RUPT: Fine scale clocking' },
  0o32: { short: 'CDUX', long: 'Inner IMU Gimbal' },
  0o33: { short: 'CDUY', long: 'Middle IMU Gimbal' },
  0o34: { short: 'CDUZ', long: 'Outer IMU Gimbal' },
  0o35: { short: 'CDUT', long: 'Rendevouz Radar Trunnion CDU' },
  0o36: { short: 'CDUS', long: 'Rendevouz Radar Shaft CDU' },
  0o37: { short: 'PIPAX', long: 'Velocity measurement - X axis' },

  0o40: { short: 'PIPAY', long: 'Velocity measurement - Y axis' },
  0o41: { short: 'PIPAZ', long: 'Velocity measurement - Z axis' },
  0o42: { short: 'BMAGX', long: 'RHC input - Pitch' },
  0o43: { short: 'BMAGY', long: 'RHC input - Yaw' },
  0o44: { short: 'BMAGZ', long: 'RHC input - Roll' },
  0o45: { short: 'INLINK', long: 'Telemetry Uplink' },
  0o46: { short: 'RNRAD', long: 'Rendevouz and Landing Radar Data' },
  0o47: { short: 'GYROCTR', long: 'Outcounter for gyro' },

  0o50: { short: 'CDUXMCD', long: 'Outcounters for X CDU' },
  0o51: { short: 'CDUYMCD', long: 'Outcounters for Y CDU' },
  0o52: { short: 'CDUZMCD', long: 'Outcounters for Z CDU' },
  0o53: { short: 'CDUTCMD', long: 'Outcounters for Trunnion CDU' },
  0o54: { short: 'CDUSCMD', long: 'Outcounters for Shaft CDU' },
  0o55: { short: 'THRUST', long: 'LM DPS Thrust Command' },
  0o56: { short: 'LEMONM', long: 'Unused' },
  0o57: { short: 'OUTLINK', long: 'Unused' },
  0o60: { short: 'ALTM', long: 'Altitude Meter' },
};

// TODO: Add feature to switch to CM mode.
const labelsCM = {
  0o35: { short: 'OPTY', long: 'Optics Y axis' },
  0o36: { short: 'OPTX', long: 'Optics X axis' },
  0o53: { short: 'CDUTCMD TVCYAW OPTYCMD', long: 'Outcounter for Optics (Y) or radar, SPS Yaw Command in TVC Mode' },
  0o54: { short: 'CDUSMCD TVCPITCH OPTXCMD', long: 'Outcounters for optics (X) or radar, SPS Pitch Command in TVC Mode' },
};

const numBanks = 8;
const numRows = 32;
const numWordsPerRow = 8;

export default class AGCErasableMemory extends HTMLElement {
  #valueEls = [];

  constructor() {
    super();
    this.rootEl = this.attachShadow({ mode: 'closed' });

    const parts = new URL(import.meta.url).pathname.split('/');
    parts.pop();
    const path = parts.join('/');
    createChild(this.rootEl, 'link', {
      attributes: { rel: 'stylesheet', href: `${path}/agc_erasable_memory.css` },
    });

    this.#valueEls = [];
    this.#construct();
  }

  set memory(memory) {
    this.mem = memory;
  }

  #construct() {
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

          const label = labels[address];

          const wordElClasses = ['word'];
          if (label) wordElClasses.push('special_register');
          const wordEl = createChild(rowEl, 'div', {
            id: `address_${addressOctal}`,
            classes: wordElClasses,
          });
          wordEl.addEventListener('mouseover', () => {
            if (!label) return;
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
          this.#valueEls.push(textEl);
        }
      }
    }
  }

  render() {
    const len = this.mem.length;
    for (let idx = 0; idx < len; idx++) {
      const wordEl = this.#valueEls[idx];
      const val = this.mem[idx];
      if (wordEl.wordValue === val) continue; // Skip unnecessary expensive DOM updates.

      wordEl.wordValue = val;
      const octalValue = `00000${val.toString(8)}`;
      const width = idx ? -5 : -6;
      wordEl.textContent = octalValue.slice(width);
    }
    window.requestAnimationFrame(() => this.render());
  }
}

customElements.define('agc-erasable-memory', AGCErasableMemory);
