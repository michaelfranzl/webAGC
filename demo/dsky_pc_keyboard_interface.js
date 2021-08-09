// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: Copyright 2020 Michael Karl Franzl <public.michael@franzl.name>

export default class DskyPcKeyboardInterface {
  constructor(dsky) {
    this.dsky = dsky;
    this.inputElement = document.getElementById('dsky_key_input');
    this.#configureInputElement();
  }

  type(string, index = 0) {
    if (index >= string.length)
      return;

    const char = string[index];
    this.#handleKeyboardKey(char); // keydown now
    setTimeout(() => this.#handleKeyboardKey(''), 200); // keyup a bit later
    const rest = string.substring(1);
    setTimeout(() => this.type(rest), 700); // next character
  }

  #configureInputElement() {
    this.inputElement.addEventListener('keyup', () => this.dsky.setAttribute('data-keypress', ''));

    this.inputElement.addEventListener('keydown', (event) => {
      if (event.ctrlKey) return; // event passthrough

      if (event.key === 'Enter') {
        // event translation
        event.target.value = `${event.target.value}E `;
        this.dsky.setAttribute('data-keypress', 'e');
        return;
      }

      if (event.key.length > 1) return; // event passthrough

      this.#handleKeyboardKey(event.key); // handle single character key strokes
      event.preventDefault(); // because handleKeyboardKey will insert the character
    });

    this.inputElement.addEventListener('paste', (event) => {
      event.preventDefault();
      for (const item of event.clipboardData.items)
        if (item.type === 'text/plain')
          item.getAsString((string) => this.type(string));
    });
  }

  #handleKeyboardKey(key) {
    if (!key)
      this.dsky.setAttribute('data-keypress', ''); // keyup

    // Prevent entering any non supported character.
    if (!/^[vn+-cpker0-9\s]$/.test(key.toLowerCase()))
      return;

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
    this.inputElement.value += key;
    if (dskyKey !== ' ')
      this.dsky.setAttribute('data-keypress', dskyKey);
  }
}
