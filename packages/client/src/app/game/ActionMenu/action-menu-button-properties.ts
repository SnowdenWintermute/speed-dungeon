import { FocusEventHandler, MouseEventHandler } from "react";

export interface ActionMenuButtonProperties {
  text: String;
  clickHandler: MouseEventHandler<HTMLButtonElement>;
  focusHandler: FocusEventHandler<HTMLButtonElement>;
  blurHandler: FocusEventHandler<HTMLButtonElement>;
  mouseEnterHandler: MouseEventHandler<HTMLButtonElement>;
  mouseLeaveHandler: MouseEventHandler<HTMLButtonElement>;
  shouldBeDisabled: boolean;
  dedicatedKeysOption: null | GameKey[];
  category: ActionButtonCategories;
}

export enum ActionButtonCategories {
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
