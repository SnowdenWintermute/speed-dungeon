import React from "react";
import { ActionMenuButtonProperties, GameKey } from "../action-menu-button-properties";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";

interface Props {
  properties: ActionMenuButtonProperties;
}

export default function ChangeTargetButton({ properties }: Props) {
  const dedicatedKey = properties.dedicatedKeysOption
    ? properties.dedicatedKeysOption[0] ?? null
    : null;

  let text = "";
  switch (dedicatedKey) {
    case GameKey.Next:
      text = "Next target (E)";
      break;
    case GameKey.Previous:
      text = "Previous target (W)";
      break;
    default:
  }
  return (
    <button
      className="pr-2 pl-2 pointer-events-auto"
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
    >
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {text}
      </span>
    </button>
  );
}
