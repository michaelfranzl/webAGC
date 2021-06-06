// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name>

import 'webdsky';
import WebAGC from 'WebAGC';
import AGCErasableMemory from './agc_erasable_memory.js';

window.addEventListener('load', async () => {
  main();
});

async function main() {
  const dsky = document.getElementsByTagName('dsky-interface')[0];
  const agc = new WebAGC({
    // Wire the AGC lamp and digit outputs to the DSKY.
    dskyOut: ({ input1, input2 }) => {
      if (input1 !== undefined)
        dsky.setAttribute('data-input1', input1.toString(2).padStart(15, '0'));
      if (input2 !== undefined)
        dsky.setAttribute('data-input2', input2.toString(2).padStart(15, '0'));
    },
  });
  const clockDivisorElement = document.getElementById('clock_divisor');
  const input = document.getElementById('dsky_key_input');

  input.addEventListener('keyup', () => dsky.setAttribute('data-keypress', ''));
  input.addEventListener('keydown', (event) => {
    if (event.ctrlKey) return; // event passthrough

    if (event.key === 'Enter') {
      // event translation
      event.target.value = `${event.target.value}E `;
      dsky.setAttribute('data-keypress', 'e');
      return;
    }

    if (event.key.length > 1) return; // event passthrough

    handleKeyboardKey(event.key); // handle single character key strokes
    event.preventDefault(); // because handleKeyboardKey will insert the character
  });
  input.addEventListener('paste', (event) => {
    event.preventDefault();
    for (const item of event.clipboardData.items)
      if (item.type === 'text/plain') item.getAsString((string) => typeStringIntoDsky(string));
  });

  document.getElementById('dsky').appendChild(dsky);
  // Wire regular DSKY key presses to the AGC
  dsky.addEventListener('keypress', ({ detail }) => agc.keyPress(detail));

  // Wire DSKY PRO key presses to the AGC
  dsky.addEventListener('proceed', ({ detail }) => agc.proceedKeyPress(detail));

  const agcReady = agc.ready().then(() => {
    let commitId;
    let agcVersion;
    if (typeof agc.version === 'function') {
      agcVersion = (typeof agc.version === 'function') ? agc.version() : 'unknown';
      [, commitId] = agcVersion.match(/^.* ([0-9a-f]{9}$)/);
    } else {
      agcVersion = 'unknown';
      commitId = 'unknown';
    }
    const link = document.getElementById('yaAGC_version');
    link.setAttribute('href', `https://github.com/michaelfranzl/virtualagc/tree/${commitId}`);
    link.innerHTML = commitId;
  });
  await Promise.all([agcReady]);

  const erasableView = document.getElementsByTagName('agc-erasable-memory')[0];
  erasableView.memory = agc.getErasable();
  erasableView.render();


  document.getElementById('programs').value = 'Luminary099.bin';
  await loadProgram('agc/Luminary099.bin');

  agc.oscillate(); // start the CPU clock
  document.getElementById('agc_state').innerHTML = 'running';

  // Show off the lamp test and uptime programs of Luminary099
  setTimeout(() => typeStringIntoDsky('V35 E '), 2000);
  setTimeout(() => typeStringIntoDsky('V16 N65 E '), 12000);

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

  document.getElementById('button_reset').addEventListener('click', () => {
    agc.reset();
  });

  document.getElementById('button_pause').addEventListener('click', () => {
    agc.oscillate(Infinity);
    document.getElementById('agc_state').innerHTML = 'paused';
  });

  document.getElementById('button_run').addEventListener('click', () => {
    agc.oscillate(getClockDivisor());
    document.getElementById('agc_state').innerHTML = 'running';
  });

  document.getElementById('button_step').addEventListener('click', () => agc.stepCpu(1));

  document.getElementById('clock_divisor').value = 1;
  document.getElementById('clock_divisor').dispatchEvent(new Event('change'));
  input.focus();

  // === FUNCTIONS ===
  function handleKeyboardKey(key) {
    if (!key)
      dsky.setAttribute('data-keypress', ''); // keyup

    // Prevent entering any non supported character.
    if (!/^[vn+-cpker0-9\s]$/.test(key.toLowerCase())) return;

    // Let's do some key mapping because webDSKY only takes alphanumerical key strokes.
    let dskyKey;
    switch (key.toLowerCase()) {
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
    input.value += key;
    if (dskyKey !== ' ')
      dsky.setAttribute('data-keypress', dskyKey);
  }

  function typeStringIntoDsky(string, index = 0) {
    if (index >= string.length) return;

    const char = string[index];
    handleKeyboardKey(char); // keydown now
    setTimeout(() => handleKeyboardKey(''), 200); // keyup a bit later
    const rest = string.substring(1);
    setTimeout(() => typeStringIntoDsky(rest), 700); // next character
  }

  async function runProgram(binary) {
    agc.loadRom(binary);
    agc.reset();
  }

  async function loadProgram(url) {
    const response = await fetch(url);
    const binary = await response.arrayBuffer();
    runProgram(binary);
  }

  function getClockDivisor() {
    switch (clockDivisorElement.value) {
      case 'inf':
        return Infinity;
      default:
        return parseInt(clockDivisorElement.value, 10);
    }
  }
}
