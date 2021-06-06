// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2021 Michael Karl Franzl <public.michael@franzl.name>

import Demo from './demo.js';

window.addEventListener('load', async () => {
  const demo = new Demo();
  demo.run();
});
