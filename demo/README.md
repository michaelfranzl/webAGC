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

This demo is a pure browser application without any knowledge of a web server. Of course, you
still need a web server to transfer the files to the browser; it's a web application after all.

This application is written in modern Javascript (e.g. modules with bare imports and other new
language features), so the untranspiled source code may not (yet) be suitable for browsers.
There are two ways of running the demo involving transpilation to the more compatible
`es2020`/`ES11` profile (requires at least Firefox version 78 or Chrome version 89), listed and
explained below.

Both methods require that you first install dependencies: Get a recent version of Node.js and run
`npm ci` (clean install) both in the parent directory *and* in this (demo) directory:

```sh
npm ci
cd demo
npm ci
```


### Development

Run in this directory:

```sh
npm run serve-dev
```

Open the application at http://localhost:8000 in your browser.

Behind the scenes, the development web server `@web/dev-server` resolves on the fly bare imports of
modules in `node_modules`. It also sends requested Javascript files through `esbuild` to transpile
modern features into a more widely supported `es2020`/`ES11` Javascript.


### Production

This method is suitable for *any* static file web server because it only needs to serve a
pre-collated set of pre-transpiled files.

This is the preferred method for production.  A copy of the resulting file and directory structure
is located and live at https://michaelfranzl.github.io/webAGC/demo

Run in this directory:

```sh
npm run build # Builds everything into the `build` directory.
```

Then serve the built files using `light-server`:

```sh
npm run serve-build
```

To prove that the built files do not have any dependencies on the Nodejs ecosystem any more,
you can serve the files using a Ruby web server for example:

```sh
gem install webrick
ruby -r un -e httpd build -p 8000
```
