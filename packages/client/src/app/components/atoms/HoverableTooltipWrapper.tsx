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
    const { x, y, width, height } = elementOption.getBoundingClientRect();
    const offsetTop = props.offsetTop !== undefined ? props.offsetTop : 4;
    let tooltipX = x + width / 2.0;
    let tooltipY = -9999; // send it off screen for measuring before showing it

    mutateUIState((store) => {
      store.tooltipText = text;
      store.tooltipPosition = { x: tooltipX, y: tooltipY };
    });

    // measure tooltip after render
    requestAnimationFrame(() => {
      const tooltipElement = document.getElementById("hoverable-tooltip");
      if (!tooltipElement) return console.error("no tooltip found");

      const tooltipRect = tooltipElement.getBoundingClientRect();
      // const viewportWidth = window.innerWidth;

      if (y - tooltipRect.height - offsetTop < 0) {
        tooltipY = Math.max(tooltipY, y + height + offsetTop + tooltipRect.height);
      } else tooltipY = y - offsetTop;

      mutateUIState((store) => {
        store.tooltipPosition = { x: tooltipX, y: tooltipY };
      });
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
      className={`h-fit w-fit cursor-help ${props.extraStyles}`}
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
