# webAGC Demo

This demo combines the following components:

* `webAGC` (wraps a WebAssembly build of `yaAGC`)
* `webDSKY` (an emulator of the user interface of the AGC)
* Control elements
  * CPU manipulation: reset, halt, run, step, clock divide
  * 'Hot-plugging' of the "fixed memory" (the 'ROM') of the AGC. In other words, plugging different
      programs into the computer while it is running.  (see below, "AGC programs")
* Live views of the AGC state
  * erasable memory with register labels and explanations
  * interactive input ports and output ports

## AGC programs

This demo allows the selection of the following AGC programs which are contained in this repository
in binary form.  A link to the exact state of the source code and build scripts is given in the
third column of the table.

Documentation of these AGC programs can be found at https://www.ibiblio.org/apollo/

<table>
<thead>
  <tr>
    <th>Name</th>
    <th>Binary</th>
    <th>Sources</th>
    <th>Notes</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Luminary099</td>
    <td><a href="agc/Luminary099.bin">agc/Luminary099.bin</a></td>
    <td><a href="https://github.com/virtualagc/virtualagc/tree/92a74ef1c88aede2e4ba0a86c6585c9ea911226d/Luminary099">Source</a></td>
    <td>Built by running <code>make</code> in the root directory.</td>
  </tr>
  <tr>
    <td>Comanche055</td>
    <td><a href="agc/Comanche055.bin">agc/Comanche055.bin</a></td>
    <td><a href="https://github.com/virtualagc/virtualagc/tree/92a74ef1c88aede2e4ba0a86c6585c9ea911226d/Comanche055">Source</a></td>
    <td>Built by running <code>make</code> in the root directory.</td>
  </tr>
  <tr>
    <td>Validation</td>
    <td><a href="agc/Validation.bin">agc/Validation.bin</a></td>
    <td><a href="https://github.com/virtualagc/virtualagc/tree/92a74ef1c88aede2e4ba0a86c6585c9ea911226d/Validation">Source</a></td>
    <td>Built by running <code>make</code> in the root directory.</td>
  </tr>
</tbody>
</table>


## How to run

In this directory

1. run `npm i -g jspm@2.0.0-beta.7`
2. run `jspm install`
3. serve the parent directory via HTTP.
4. access `demo/index.html` using a browser supporting [import maps](https://caniuse.com/?search=importmap) (e.g. based on Chromium 89 or newer). For example, visit: http://localhost:8000/demo/

A copy of the resulting file and directory structure is located at https://michaelfranzl.github.io/webAGC/demo (and so it should be a fully functioning demo).
