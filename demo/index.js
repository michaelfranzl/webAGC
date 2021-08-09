// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import Demo from './demo.js';

function getBrowserInfo() {
  const result = {
    name: 'other',
    version: 0,
    os: 'unknown',
  };
  let matches;

  matches = navigator.userAgent.match(/(Chrome)\/(\d\d)/);
  if (matches) {
    result.name = matches[1];
    result.version = parseInt(matches[2]);
  }
  matches = navigator.userAgent.match(/(Firefox)\/(\d\d)/);
  if (matches) {
    result.name = matches[1];
    result.version = parseInt(matches[2]);
  }
  if (navigator.userAgent.indexOf('Linux') !== -1)
    result.os = 'Linux';
  else if (navigator.userAgent.indexOf('Windows') !== -1)
    result.os = 'Windows';
  else if (navigator.userAgent.indexOf('Macintosh') !== -1)
    result.os = 'Mac';

  return result;
}

window.addEventListener('load', async () => {
  const browserInfo = getBrowserInfo();
  if (
    (browserInfo.name === 'Firefox' && browserInfo.version < 78)
    || (browserInfo.name.startsWith('Chrom') && browserInfo.version < 89)
  )
    document.getElementById('errors').innerHTML = 'This browser is too old. The application may not run correctly, or at all. Requiring at least Firefox version 78 or Chrome version 89.';

  const demo = new Demo();
  demo.run();
});
