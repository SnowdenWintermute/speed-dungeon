import React from "react";
import { ActionMenuButtonProperties, formatGameKey } from "../action-menu-button-properties";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";

interface Props {
  properties: ActionMenuButtonProperties;
}

export default function TopButton({ properties }: Props) {
  const keyToShow = properties.dedicatedKeysOption ? properties.dedicatedKeysOption[0] : null;
  return (
    <button
      className="w-full border border-slate-400 bg-slate-700 flex hover:bg-slate-950 disabled:opacity-50 max-w-fit whitespace-nowrap text-ellipsis overflow-hidden mr-2 last:mr-0 pointer-events-auto"
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
    >
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {properties.text}
        {formatGameKey(keyToShow)}
      </span>
    </button>
  );
}
