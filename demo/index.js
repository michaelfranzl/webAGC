// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name>

import 'webdsky';
import WebAGC from 'WebAGC';

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

window.addEventListener('load', async (_) => {
  console.log('onload');
  main();
});

async function main() {
  // Create a DSKY instance.
  const dsky = createDsky();

  // Create a yaAGC instance.
  const agc = new WebAGC({
    // Wire the AGC lamp and digit outputs to the DSKY.
    dskyOut: ({ input1, input2 }) => {
      if (input1 !== undefined)
        dsky.setAttribute('data-input1', input1.toString(2).padStart(15, '0'));
      if (input2 !== undefined)
        dsky.setAttribute('data-input2', input2.toString(2).padStart(15, '0'));
    },
  });

  // Wire the DSKY key presses to the AGC (the PRO key is wired separately).
  dsky.addEventListener('keypress', ({ detail }) => agc.keyPress(detail));
  dsky.addEventListener('proceed', ({ detail }) => agc.proceedKeyPress(detail));

  const agcReady = agc.ready().then(() => console.log(`AGC version ${agc.version()} is ready`));
  await Promise.all([agcReady]);

  const erasable = agc.getErasable();
  const wordEls = [];

  // Start the virtual computer clock.
  agc.oscillate();
  viewErasableMemory();

  async function runProgram(binary) {
    const checksum = await crypto.subtle.digest('SHA-1', binary);
    console.log('Loading ROM with SHA-1 checksum', buf2hex(checksum));
    agc.loadRom(binary);
    agc.reset();
  }

  async function loadProgram(url) {
    const response = await fetch(url);
    const binary = await response.arrayBuffer();
    runProgram(binary);
  }

  function viewErasableMemory() {
    const domEl = document.getElementById('erasable');
    for (let bankIdx = 0; bankIdx < 8; bankIdx++) {
      const bankEl = document.createElement('div');
      bankEl.classList.add('bank');
      const headingEl = document.createElement('p');
      headingEl.innerHTML = `Bank ${parseInt(bankIdx, 8)}`;
      bankEl.appendChild(headingEl);
      domEl.appendChild(bankEl);
      for (let rowIdx = 0; rowIdx < 32; rowIdx++) {
        const rowEl = document.createElement('div');
        bankEl.appendChild(rowEl);
        for (let wordIdx = 0; wordIdx < 8; wordIdx++) {
          const wordEl = document.createElement('span');
          wordEl.classList.add('word');
          wordEl.wordValue = 0;
          wordEl.innerHTML = '.....';
          rowEl.appendChild(wordEl);
          wordEls.push(wordEl);
        }
      }
    }
    updateErasableMemory();
  }

  function updateErasableMemory() {
    for (let idx = 0; idx < erasable.length; idx++) {
      const wordEl = wordEls[idx];
      const val = erasable[idx];
      if (wordEl.wordValue === val) continue; // Skip unnecessary expensive DOM updates.

      wordEl.wordValue = val;
      wordEl.innerHTML = `0000${val.toString(8)}`.slice(-5); // octal output of a 16 bit word
    }
    window.requestAnimationFrame(updateErasableMemory);
  }

  const clockDivisorElement = document.getElementById('clock_divisor');

  function getClockDivisor() {
    switch (clockDivisorElement.value) {
      case 'inf':
        return Infinity;
      default:
        return parseInt(clockDivisorElement.value, 10);
    }
  }
  clockDivisorElement.addEventListener('change', (event) => {
    const divisor = event.target.value === 'inf' ? Infinity : parseInt(event.target.value, 10);
    agc.oscillate(divisor);
    const cycleTimeUs = 11.72;
    document.getElementById('clock_speed')
      .innerHTML = `${(1 / cycleTimeUs * 1000000 / divisor).toFixed(1)} Hz`;
  });

  document.getElementById('programs').addEventListener('change', (event) => {
    const programName = event.target.value;
    loadProgram(`agc/${programName}`);
  });

  document.getElementById('button_reset')
    .addEventListener('click', () => {
      // TODO: Clear DSKY digits and lights
      agc.reset();
    });

  document.getElementById('button_pause')
    .addEventListener('click', () => agc.oscillate(Infinity));

  document.getElementById('button_run')
    .addEventListener('click', () => agc.oscillate(getClockDivisor()));

  document.getElementById('button_step')
    .addEventListener('click', () => agc.stepCpu(1)());

  document.getElementById('clock_divisor').value = 1;
  document.getElementById('clock_divisor').dispatchEvent(new Event('change'));
}


function createDsky() {
  const dsky = document.createElement('dsky-interface');
  document.getElementById('dsky').appendChild(dsky);

  const input = document.getElementById('dsky_key_input');
  input.focus();

  function handleKeyboardKey(key) {
    // Prevent entering any non supported character.
    if (!/^[vn+-cpker0-9\s]$/.test(key.toLowerCase())) return true;

    // Let's do some key mapping because webDSKY only takes alphanumerical key strokes.
    let dskyKey;
    switch(key.toLowerCase()) {
      case '+':
        dskyKey = 'p';
        break;
      case '-':
        dskyKey = 'm';
        break;
      case 'p':
        dskyKey = 'o'; // o because p is taken by +
        break;
      default:
        dskyKey = key.toLowerCase();
    }
    input.value = input.value + key;
    if (dskyKey != ' ')
      dsky.setAttribute('data-keypress', dskyKey);
  }

  input.addEventListener('keydown', (event) => {
    if (event.ctrlKey) return; // event passthrough

    if (event.key === 'Enter') {
      // event translation
      event.target.value = event.target.value + 'E ';
      dsky.setAttribute('data-keypress', 'e');
      return;
    }

    if (event.key.length > 1) return; // event passthrough

    handleKeyboardKey(event.key); // handle 1 character key strokes
    event.preventDefault();
  });

  function typeStringIntoDsky(string, index = 0) {
    if (index >= string.length) return;

    const char = string[index];
    handleKeyboardKey(char);

    const rest = string.substring(1);
    setTimeout(() => typeStringIntoDsky(rest), 500);
    setTimeout(() => dsky.setAttribute('data-keypress', ''), 800);
  }

  input.addEventListener('paste', (event) => {
    event.preventDefault();
    for (const item of event.clipboardData.items)
      if (item.type === 'text/plain') item.getAsString((string) => typeStringIntoDsky(string));
  });

  input.addEventListener('keyup', () => dsky.setAttribute('data-keypress', ''));

  return dsky;
}
