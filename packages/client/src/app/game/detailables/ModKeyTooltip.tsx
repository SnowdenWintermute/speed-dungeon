import React from "react";

export default function ModKeyTooltip() {
  return (
    <span className="flex">
      {" "}
      <span className="border border-slate-400 rounded-md pr-1 pl-1 mr-2">{"shift"}</span>
      {
        // <HoverableTooltipWrapper tooltip_text={"hold shift to compare alternate slot"}>
      }
      <span>{"ⓘ "}</span>
      {
        // </HoverableTooltipWrapper>
      }
    </span>
  );
}
