import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'; // new URL('', import.meta.url)
import { nodeResolve } from '@rollup/plugin-node-resolve';
import html from '@web/rollup-plugin-html'; // for rollup-plugin-import-meta-assets
import { babel } from '@rollup/plugin-babel';
import { copy } from '@web/rollup-plugin-copy';
import process from 'process';

import path from 'path';
import fs from 'fs';

fs.mkdirSync('build/assets', { recursive: true });

const buildDir = 'build';

const banner = '// This file was generated using the build script of webAGC. See https://github.com/michaelfranzl/webAGC';

function copyAssetsFromStylesheet(fileContent, filePath) {
  console.log('Copying assets from CSS file', path.relative(process.cwd(), filePath));
  const regex = /url\(['"]*(.+?)['"]*\)/g;
  let result;
  while (result = regex.exec(fileContent)) {
    const value = result[1];
    // Only allow values without or with current path, e.g. url(file.png), or url(./file.png)
    if (
      value.indexOf('#') === 0 // skip hash URIs
      || value.indexOf('/') === 0 // skip absolute paths
      || value.indexOf('..') === 0 // skip paths outside of sylesheet
      || value.indexOf('data:') === 0 // skip data URLs
      || /^[a-zA-Z]+:\/\//.test(value)
    ) { // skip URLs
      console.error(`WARNING: Will not copy non-same-directory asset ${value}.`);
      continue;
    }
    const srcFilename = path.join(path.dirname(filePath), value);
    console.log('  Copying asset', value);
    fs.copyFileSync(srcFilename, `${buildDir}/assets/${value}`);
    // TODO: Hash filename
  }
}

export default {
  output: {
    dir: buildDir,
    banner,
    footer: banner,
    // assetFileNames: 'assets/[name][extname]',
    entryFileNames: '[name]-[hash].js',
    sourcemap: true,
  },
  plugins: [
    html({
      input: 'index.html',
      transformAsset: (fileContent, filePath) => {
        if (filePath.includes('.css')) copyAssetsFromStylesheet(fileContent, filePath);
        return fileContent;
      },
    }),
    importMetaAssets({
      transform: (fileContent, filePath) => {
        // See also https://github.com/rollup/rollup/issues/2872
        if (filePath.includes('.css')) copyAssetsFromStylesheet(fileContent, filePath);
        return fileContent;
      },
    }),
    nodeResolve(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              firefox: 78,
            },
            // useBuiltIns: "entry",
          },
        ],
      ],
    }),
    copy({ patterns: 'agc/*.bin' }),
  ],
};
