import { MutateState } from "@/stores/mutate-state";
import { UIState, useUIStore } from "@/stores/ui-store";
import React, { ReactNode, useRef } from "react";

interface Props {
  tooltipText: string;
  children: ReactNode;
}

export default function HoverableTooltipWrapper(props: Props) {
  const mutateUIState = useUIStore().mutateState;
  const elementRef = useRef<HTMLDivElement>(null);

  function showTooltip(
    mutateUIState: MutateState<UIState>,
    elementOption: null | HTMLDivElement,
    text: string
  ) {
    if (!elementOption) return;
    const { x, y, width } = elementOption.getBoundingClientRect();
    mutateUIState((store) => {
      store.tooltipPosition = [x + width / 2.0, y];
      store.tooltipText = text;
    });
  }

  function hideTooltip(mutateUIState: MutateState<UIState>) {
    mutateUIState((store) => {
      store.tooltipPosition = null;
      store.tooltipText = null;
    });
  }

  function handleMouseEnter(_e: React.MouseEvent) {
    showTooltip(mutateUIState, elementRef.current, props.tooltipText);
  }

  function handleMouseLeave(_e: React.MouseEvent) {
    hideTooltip(mutateUIState);
  }

  function handleFocus(_e: React.FocusEvent): void {
    showTooltip(mutateUIState, elementRef.current, props.tooltipText);
  }

  function handleBlur(_e: React.FocusEvent): void {
    hideTooltip(mutateUIState);
  }

  return (
    <div
      className="h-full w-full cursor-help"
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
    >
      {props.children}
    </div>
  );
}
