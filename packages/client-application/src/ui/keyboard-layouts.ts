export enum KeyboardLayout {
  Qwerty,
  Dvorak,
  Colemak,
}

export const KEYBOARD_LAYOUT_STRINGS: Record<KeyboardLayout, string> = {
  [KeyboardLayout.Qwerty]: "QWERTY",
  [KeyboardLayout.Dvorak]: "Dvorak",
  [KeyboardLayout.Colemak]: "Colemak",
};

// physical letter key codes in QWERTY row order
const LETTER_CODES = [
  "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP",
  "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL",
  "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM",
];

// the character each physical position (LETTER_CODES order) produces per layout
const LAYOUT_LETTER_OUTPUTS: Record<KeyboardLayout, string> = {
  [KeyboardLayout.Qwerty]: "qwertyuiopasdfghjklzxcvbnm",
  [KeyboardLayout.Dvorak]: "',.pyfgcrlaoeuidhtn;qjkxbw",
  [KeyboardLayout.Colemak]: "qwfpgjluy;arstdhneizxcvbkm",
};

function buildCodeToValue(layout: KeyboardLayout): Record<string, string> {
  const outputs = LAYOUT_LETTER_OUTPUTS[layout];
  const map: Record<string, string> = {};
  LETTER_CODES.forEach((code, index) => {
    map[code] = outputs.charAt(index);
  });
  return map;
}

export const PHYSICAL_CODE_TO_VALUE: Record<KeyboardLayout, Record<string, string>> = {
  [KeyboardLayout.Qwerty]: buildCodeToValue(KeyboardLayout.Qwerty),
  [KeyboardLayout.Dvorak]: buildCodeToValue(KeyboardLayout.Dvorak),
  [KeyboardLayout.Colemak]: buildCodeToValue(KeyboardLayout.Colemak),
};

// named keys whose produced value differs from their code; everything else
// falls back to the code lowercased (Escape -> escape, Enter -> enter, etc.)
const NAMED_CODE_TO_VALUE: Record<string, string> = {
  Space: " ",
};

export function normalizeKeyValue(raw: string): string {
  return raw.toLowerCase();
}

export function keyValueForCode(code: string, layout: KeyboardLayout): string {
  const letterValue = PHYSICAL_CODE_TO_VALUE[layout][code];
  if (letterValue !== undefined) {
    return letterValue;
  }
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }
  const namedValue = NAMED_CODE_TO_VALUE[code];
  if (namedValue !== undefined) {
    return namedValue;
  }
  return normalizeKeyValue(code);
}

export function numberKeyValue(n: number): string {
  return String(n);
}

const KEY_VALUE_DISPLAY_OVERRIDES: Record<string, string> = {
  " ": "Space",
  escape: "Esc",
  enter: "Enter",
  tab: "Tab",
  control: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  meta: "Meta",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  backspace: "Backspace",
  delete: "Del",
  capslock: "Caps",
};

export function keyValueToDisplayString(value: string): string {
  const normalized = normalizeKeyValue(value);
  const override = KEY_VALUE_DISPLAY_OVERRIDES[normalized];
  if (override !== undefined) {
    return override;
  }
  if (normalized.length === 1) {
    return normalized.toUpperCase();
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
