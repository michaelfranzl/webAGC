// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name>

import { WASI } from "@wasmer/wasi";
import { WasmFs } from "@wasmer/wasmfs";

export default async function instantiateWasiModule(url, memory, imports = {}) {
  const wasmfs = new WasmFs();

  const wasi = new WASI({
    preopens: {
      '/': '/',
    },
    bindings: {
      ...WASI.defaultBindings,
      fs: wasmfs.fs,
    },
  });

  wasi.setMemory(memory);

  const module = await WebAssembly.compileStreaming(fetch(url));
  const { wasi_snapshot_preview1 } = wasi.getImports(module);
  const instance = await WebAssembly.instantiate(module, { ...imports, wasi_snapshot_preview1 });

  return { wasmfs, instance };
}
