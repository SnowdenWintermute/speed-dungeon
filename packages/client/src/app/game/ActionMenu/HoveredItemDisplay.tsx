import React from "react";
import { ItemDetailsWithComparison } from "../ItemDetailsWithComparison";
import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client_consts";

export default function HoveredItemDisplay() {
  return (
    <div className="ml-3 h-0 w-0">
      <div
        className="fixed min-w-[50rem] max-w-[50rem]"
        style={{
          height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem`,
        }}
      >
        <ItemDetailsWithComparison />
      </div>
    </div>
  );
}
