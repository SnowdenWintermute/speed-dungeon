import { FocusEventHandler, MouseEventHandler, ReactNode } from "react";

export class ActionMenuButtonProperties {
  focusHandler?: FocusEventHandler<HTMLButtonElement>;
  blurHandler?: FocusEventHandler<HTMLButtonElement>;
  mouseEnterHandler?: MouseEventHandler<HTMLButtonElement>;
  mouseLeaveHandler?: MouseEventHandler<HTMLButtonElement>;
  shouldBeDisabled: boolean = false;
  dedicatedKeys: string[] = [];
  shouldDisableMainClickOnly: boolean = false;
  constructor(
    public jsx: () => ReactNode,
    public key: string,
    public clickHandler: MouseEventHandler<HTMLButtonElement>,
    public alternateClickHandler?: MouseEventHandler<HTMLButtonElement>
  ) {}
}
