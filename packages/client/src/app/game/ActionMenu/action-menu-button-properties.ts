import { FocusEventHandler, MouseEventHandler } from "react";

export interface ActionMenuButtonProperties {
  text: string;
  clickHandler: MouseEventHandler<HTMLButtonElement>;
  focusHandler: FocusEventHandler<HTMLButtonElement>;
  blurHandler: FocusEventHandler<HTMLButtonElement>;
  mouseEnterHandler: MouseEventHandler<HTMLButtonElement>;
  mouseLeaveHandler: MouseEventHandler<HTMLButtonElement>;
  shouldBeDisabled: boolean;
  dedicatedKeysOption: null | GameKey[];
  category: ActionButtonCategory;
}

export enum ActionButtonCategory {
  Top,
  Numbered,
  NextPrevious,
}

export enum GameKey {
  Cancel,
  Confirm,
  Next,
  Previous,
  S,
  I,
  D,
  O,
  F,
  P,
  T,
}

export const GAME_KEYS_TO_KEYPRESS_CODES: Partial<Record<GameKey, string[]>> = {
  [GameKey.Confirm]: ["Enter", "KeyR"],
  [GameKey.Next]: ["KeyE"],
  [GameKey.Previous]: ["KeyW"],
  [GameKey.S]: ["KeyS"],
  [GameKey.I]: ["KeyI"],
  [GameKey.D]: ["KeyD"],
  [GameKey.O]: ["KeyO"],
  [GameKey.F]: ["KeyF"],
  [GameKey.P]: ["KeyP"],
  [GameKey.T]: ["KeyT"],
};

export const GAME_KEYS_TO_KEYUP_CODES: Partial<Record<GameKey, string[]>> = {
  [GameKey.Cancel]: ["Escape"],
  [GameKey.Next]: ["ArrowRight"],
  [GameKey.Previous]: ["ArrowLeft"],
};

export function formatGameKey(keyOption: null | GameKey) {
  if (keyOption === null) return "";
  switch (keyOption) {
    case GameKey.Cancel:
      return "Esc";
    case GameKey.Confirm:
      return "R";
    case GameKey.Next:
      return "E";
    case GameKey.Previous:
      return "W";
    case GameKey.S:
      return "S";
    case GameKey.I:
      return "I";
    case GameKey.D:
      return "D";
    case GameKey.O:
      return "O";
    case GameKey.F:
      return "F";
    case GameKey.P:
      return "P";
    case GameKey.T:
      return "T";
  }
}
