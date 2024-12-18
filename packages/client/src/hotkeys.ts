export const HOTKEYS = {
  CANCEL: "Escape",
  MAIN_1: "KeyF",
  MAIN_2: "KeyA",
  ALT_1: "KeyR",
  ALT_2: "KeyQ",
  SIDE_1: "KeyG",
  SIDE_2: "KeyT",
  RIGHT_MAIN: "KeyD",
  LEFT_MAIN: "KeyS",
  RIGHT_ALT: "KeyE",
  LEFT_ALT: "KeyW",
  BOTTOM_LEFT: "KeyX",
  BOTTOM_RIGHT: "KeyC",
};

export function letterFromKeyCode(keycode: string) {
  return keycode.slice(3);
}
