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
