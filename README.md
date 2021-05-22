# webAGC

`webAGC` is a port of `yaAGC`, an emulator of the Apollo Guidance Computer, to the [Web
platform](https://en.wikipedia.org/wiki/Web_platform).

The WebAssembly binary of `yaAGC` is contained in this repository:

[src/yaAGC.wasm](src/yaAGC.wasm)

It was built using source code and build scripts in the state of commit ID

`ddc65e7bed41f1301921b934fcbaaee93db99dda`

of

https://github.com/michaelfranzl/virtualagc

For transparency, the WebAssembly module exports a function `version()` which returns a pointer to a
null-terminated string containing this commit ID.

## Demo

See the [demo](demo) subdirectory.
