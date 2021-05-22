// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name> */

import { stringFromMemory } from './lib/wasm_c_utilities/strings.js';
import loadWasiBinary from './lib/wasm_c_utilities/load.js';

function modulePath() {
  const parts = new URL(import.meta.url).pathname.split('/');
  parts.pop();
  return parts.join('/');
}

export default class WebAGC {
  constructor({ dskyOut }) {
    this.url = `${modulePath()}/yaAGC.wasm`;

    this.data = {
      ports: {
        proceedKey: 0o32,
        normalKey: 0o15,
      },
      bits: {
        proceedKey: 1 << 13,
      },
    };

    this.state = {
      lamps: 0,
    };

    this.dskyOut = dskyOut;

    this.readyPromise = this.load()
      .then(() => this.configure());
  }

  async ready() {
    return this.readyPromise;
  }

  async load() {
    this.mem = new WebAssembly.Memory({ initial: 5 });
    this.memArray = new Uint8Array(this.mem.buffer);

    const imports = { env: { memory: this.mem } };
    const { wasmfs, instance } = await loadWasiBinary(this.url, this.mem, imports);
    this.instance = instance;
    this.wasmfs = wasmfs;
  }

  version() {
    return stringFromMemory(this.memArray, this.instance.exports.version());
  }

  configure() {
    const uBit = 1 << 8;
    this.writeIo(this.data.ports.proceedKey & uBit, this.data.bits.proceedKey);
    this.writeIo(this.data.ports.normalKey & uBit, 0x11111);
  }

  writeIo(port, data) {
    this.instance.exports.packet_write(port, data);
  }

  keyPress(keyCode) {
    this.writeIo(this.data.ports.normalKey, keyCode);
  }

  proceedKeyPress(state) {
    this.writeIo(this.data.ports.proceedKey, state ? this.data.bits.proceedKey : 0);
  }

  readIo() {
    const data = this.instance.exports.packet_read();
    const channel = data >> 16;
    const value = data & 0xffff;
    return [channel, value];
  }

  getErasable() {
    if (this.erasableArray)
      return this.erasableArray;

    const ptr = this.instance.exports.get_erasable_ptr();
    this.erasableArray = new Uint16Array(this.mem.buffer, ptr, 2048);
    return this.erasableArray;
  }

  stepCpu(steps) {
    this.instance.exports.cpu_step(steps);
    // overflow in approx. Number.MAX_SAFE_INTEGER * cycleMs / 1000 / 3600 / 24 / 365 = 3347 years
    this.totalSteps += steps;
  }

  async loadRom(rom) {
    const romArray = new Uint8Array(rom);
    const romPtr = this.instance.exports.malloc(romArray.length * romArray.BYTES_PER_ELEMENT);

    this.memArray.set(romArray, romPtr);
    this.instance.exports.set_fixed(romPtr);
    this.instance.exports.free(romPtr);
  }

  reset() {
    this.instance.exports.cpu_reset();
  }

  readAllIo() {
    let [channel, value] = this.readIo();
    while (channel || value) {
      if (channel === 0o10) { // DSKY digits
        this.dskyOut({ input1: value });

      } else if (channel === 0o11) {
        const bitmask = 0b110;
        // Bit 2: COMP ACTY
        // Bit 3: UPLINK ACTY
        this.state.lamps = (this.state.lamps & (~bitmask >>> 0)) | (value & bitmask);
        this.dskyOut({ input2: this.state.lamps });

      } else if (channel === 0o163) { // Fictitious port for blinking lights
        const bitmask = 0b111111000;
        // Bit 1: AGC warning
        // Bit 4: TEMP lamp
        // Bit 5: KEY REL lamp
        // Bit 6: VERB/NOUN flash
        // Bit 7: OPER ERR lamp
        // Bit 8: RESTART lamp
        // Bit 9: STBY lamp
        // Bit 10: EL off
        // console.log('blinking lamps', this.state.lamps);
        this.state.lamps = (this.state.lamps & (~bitmask >>> 0)) | (value & bitmask);
        this.dskyOut({ input2: this.state.lamps });
      }

      [channel, value] = this.readIo();
    }
  }

  oscillate(clockDivisor = 1) {
    const approxFramerate = 60;
    const cycleMs = 0.01172; // 11.72 microseconds per cycle
    let startTime = performance.now();

    this.clockDivisor = clockDivisor;
    this.totalSteps = 0;
    this.interval ||= setInterval(() => {
      const targetSteps = Math.floor((performance.now() - startTime) / cycleMs / this.clockDivisor);
      const diffSteps = targetSteps - this.totalSteps;
      if (diffSteps < 0 || diffSteps > 100000) {
        // No matter which cause, prevent hanging due to high step counts due to integer overflows.
        startTime = performance.now();
        this.totalSteps = 0;
        return;
      }
      this.stepCpu(diffSteps);
      this.readAllIo();
    }, 1000 / approxFramerate);
  }
}
