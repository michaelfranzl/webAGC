// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import 'webdsky';

import WebAGC from '../src/webAGC.js';
import AGCErasableMemory from './agc_erasable_memory.js';
import AGCChannel from './agc_channel.js';
import DskyPcKeyboardInterface from './dsky_pc_keyboard_interface.js';

function toAGCBinaryString(value) {
  return value.toString(2).padStart(15, '0');
}

export default class Demo {
  #clockDivisorElement = document.getElementById('clock_divisor');

  constructor() {
    this.#createDSKY();
    this.dskyPcKeyboardInterface = new DskyPcKeyboardInterface(this.dsky);

    this.#createAGC();
  }

  async run() {
    this.channelEls = {};
    await this.agc.ready();

    this.#configureClockDivisor();
    this.#configureAGCProgramSelector();
    this.#configureCPUManipulationButtons();

    this.#showVersion();
    this.agc.oscillate(1);
    document.getElementById('agc_state').innerHTML = 'running';
  }

  luminary099Demo() {
    // Show off; the lamp test and uptime programs of Luminary099.
    document.getElementById('agc_program_selector').value = 'Luminary099.bin';
    document.getElementById('agc_program_selector').dispatchEvent(new Event('change'));
    setTimeout(() => this.dskyPcKeyboardInterface.type('V35 E '), 2000);
    setTimeout(() => this.dskyPcKeyboardInterface.type('V16 N65 E '), 12000);
  }

  #showVersion() {
    const agcVersion = this.agc.version();
    let commitId;
    try {
      [, commitId] = agcVersion.match(/^.* ([0-9a-f]{9}$)/);
    } catch {
      commitId = 'unknown';
    }
    const link = document.getElementById('yaAGC_version');
    link.setAttribute('href', `https://github.com/michaelfranzl/virtualagc/tree/${commitId}`);
    link.innerHTML = commitId;
  }

  async #loadProgram(url) {
    const response = await fetch(url);
    const binary = await response.arrayBuffer();
    this.#runProgram(binary);
  }

  async #runProgram(binary) {
    this.agc.loadRom(binary);
    this.agc.reset();
  }

  #createAGC() {
    this.agc = new WebAGC({
      onDSKYLightsUpdate: (value) => this.dsky.setAttribute('data-input2', toAGCBinaryString(value)),
      onChannelUpdate: (channelNumber, value) => {
        switch (channelNumber) {
          case 0o05:
          case 0o06:
          case 0o10:
            this.dsky.setAttribute('data-input1', toAGCBinaryString(value));
          case 0o11:
            // Some bits need to be sent to DSKY lights. This is handled by onDSKYLightsUpdate.
          case 0o12:
          case 0o13:
          case 0o14:
            this.channelEls[channelNumber]?.setAttribute('data-state', toAGCBinaryString(value));
            break;
          default:
            break;
        }
      },
    });
  }

  #renderIOChannels(simType) {
    this.channelEls = {};

    for (const el of new Array(...document.getElementsByTagName('agc-channel')))
      el.remove();

    const outputChannels = [0o5, 0o6, 0o10, 0o11, 0o12, 0o13, 0o14];
    for (const chanNumber of outputChannels) {
      const chanEl = document.createElement('agc-channel');
      chanEl.setAttribute('data-direction', 'output');
      chanEl.setAttribute('data-type', simType);
      chanEl.setAttribute('data-channel', chanNumber);
      chanEl.addEventListener('change', ({ detail }) => this.agc.writeIo(chanNumber, detail));
      document.getElementById('channels_output').appendChild(chanEl);
      this.channelEls[chanNumber] = chanEl;
    }

    const inputChannels = [0o15, 0o16, 0o30, 0o31, 0o32, 0o33, 0o77];
    for (const chanNumber of inputChannels) {
      const chanEl = document.createElement('agc-channel');
      chanEl.setAttribute('data-direction', 'input');
      chanEl.setAttribute('data-type', simType);
      chanEl.setAttribute('data-channel', chanNumber);
      chanEl.addEventListener('change', ({ detail }) => this.agc.writeIo(chanNumber, detail));
      document.getElementById('channels_input').appendChild(chanEl);
      this.channelEls[chanNumber] = chanEl;
    }
  }

  #createDSKY() {
    this.dsky = document.createElement('dsky-interface');
    document.getElementById('dsky').appendChild(this.dsky);
    this.dsky.addEventListener('keypress', ({ detail }) => {
      this.agc.keyPress(detail);
      this.channelEls[0o15]?.setAttribute('data-state', toAGCBinaryString(detail));
    });

    this.dsky.addEventListener('proceed', ({ detail }) => this.agc.proceedKeyPress(detail));
  }

  #configureClockDivisor() {
    this.#clockDivisorElement.addEventListener('change', () => {
      const divisor = this.#getClockDivisor();
      this.agc.oscillate(divisor);
      const cycleTimeUs = 11.72;
      document.getElementById('clock_speed')
        .innerHTML = `${(1 / cycleTimeUs * 1000000 / divisor).toFixed(1)} Hz`;
    });
  }

  #configureAGCProgramSelector() {
    document.getElementById('agc_program_selector').value = '';
    document.getElementById('agc_program_selector').addEventListener('change', (event) => {
      const programName = event.target.value;

      let simulationType;
      if (programName.includes('Luminary'))
        simulationType = 'LM';
      else if (programName.includes('Comanche'))
        simulationType = 'CM';
      else
        simulationType = 'other';

      for (const el of new Array(...document.getElementsByTagName('agc-erasable-memory')))
        el.remove();

      const erasableView = document.createElement('agc-erasable-memory');
      erasableView.setAttribute('data-type', simulationType);
      erasableView.memory = this.agc.getErasable();
      document.getElementById('agc_erasable_memory').appendChild(erasableView);
      erasableView.render();

      this.#renderIOChannels(simulationType);
      this.#loadProgram(`agc/${programName}`);
    });
  }

  #configureCPUManipulationButtons() {
    document.getElementById('button_reset').addEventListener('click', () => this.agc.reset());

    document.getElementById('button_pause').addEventListener('click', () => {
      this.agc.oscillate(Infinity);
      document.getElementById('agc_state').innerHTML = 'paused';
    });

    document.getElementById('button_run').addEventListener('click', () => {
      this.agc.oscillate(this.#getClockDivisor());
      document.getElementById('agc_state').innerHTML = 'running';
    });

    document.getElementById('button_step').addEventListener('click', () => this.agc.stepCpu(1));

    document.getElementById('clock_divisor').value = 1;
    document.getElementById('clock_divisor').dispatchEvent(new Event('change'));
  }

  #getClockDivisor() {
    switch (this.#clockDivisorElement.value) {
      case 'inf':
        return Infinity;
      default:
        return parseInt(this.#clockDivisorElement.value, 10);
    }
  }
}
