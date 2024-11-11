import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import React from "react";

export default function ModKeyTooltip() {
  return (
    <span className="flex items-center">
      <HoverableTooltipWrapper tooltipText={"hold shift to compare alternate slot"}>
        <span className="pr-1 pl-1 mr-2">( shift )</span>
        <span>{"ⓘ "}</span>
      </HoverableTooltipWrapper>
    </span>
  );
}
