import { MutateState } from "@/stores/mutate-state";
import { UIState, useUIStore } from "@/stores/ui-store";
import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  tooltipText?: string;
  extraStyles?: string;
  offsetTop?: number;
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
    const offsetTop = props.offsetTop !== undefined ? props.offsetTop : 4;
    mutateUIState((store) => {
      store.tooltipPosition = { x: x + width / 2.0, y: y - offsetTop };
      store.tooltipText = text;
    });
  }

  function hideTooltip(mutateUIState: MutateState<UIState>) {
    mutateUIState((store) => {
      store.tooltipPosition = null;
      store.tooltipText = null;
    });
  }

  useEffect(() => {
    return () => hideTooltip(mutateUIState);
  }, []);

  function handleMouseEnter(_e: React.MouseEvent) {
    if (props.tooltipText) showTooltip(mutateUIState, elementRef.current, props.tooltipText);
  }

  function handleMouseLeave(_e: React.MouseEvent) {
    hideTooltip(mutateUIState);
  }

  function handleFocus(_e: React.FocusEvent): void {
    if (props.tooltipText) showTooltip(mutateUIState, elementRef.current, props.tooltipText);
  }

  function handleBlur(_e: React.FocusEvent): void {
    hideTooltip(mutateUIState);
  }

  return (
    <div
      className={`h-fit w-fit pointer-events-auto cursor-help ${props.extraStyles}`}
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
