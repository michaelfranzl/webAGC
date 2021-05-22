// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name>

function stringFromMemory(mem, ptr) {
  const len = mem.subarray(ptr).indexOf(0); // find null character
  return new TextDecoder().decode(mem.subarray(ptr, ptr + len)); // decode until null character
}

function stringToMemory(string, mem, ptr) {
  const stats = new TextEncoder().encodeInto(string, ptr ? mem.subarray(ptr) : mem);
  if (ptr + stats.written < mem.length) mem[ptr + stats.written] = 0; // append null character
  return stats;
}

function callWithArgcArgv({
  instance, mem, func: main, name, args,
}) {
  const sizeofCharPtr = 4; // 64 bits for addressing memory
  const { malloc, free } = instance.exports;
  if (!free) throw new Error('Instance needs to export `free`.');

  const memDataView = new DataView(mem);
  const memArray = new Uint8Array(mem);

  const pointersToFree = [];

  args.unshift(name || '');
  const argc = args.length;

  const argv = malloc(argc * sizeofCharPtr);
  pointersToFree.push(argv);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const ptr = malloc(arg.length + 1); // length of string plus null character
    pointersToFree.push(ptr);
    memDataView.setUint32(argv + i * sizeofCharPtr, ptr, true); // copy ptr into argv
    stringToMemory(arg, memArray, ptr); // copy string into memory
  }

  // main call
  const retval = main(argc, argv);

  // clean up
  for (const ptr of pointersToFree)
    free(ptr);

  return retval;
}

export {
  stringFromMemory,
  stringToMemory,
  callWithArgcArgv,
};
