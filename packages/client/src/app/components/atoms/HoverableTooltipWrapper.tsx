import { AppStore } from "@/mobx-stores/app-store";
import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  tooltipText?: string;
  extraStyles?: string;
  offsetTop?: number;
  children: ReactNode;
}

export default function HoverableTooltipWrapper(props: Props) {
  const { tooltipStore } = AppStore.get();
  const elementRef = useRef<HTMLDivElement>(null);

  function showTooltip(elementOption: null | HTMLDivElement, text: string) {
    if (!elementOption) return;
    const { x, y, width, height } = elementOption.getBoundingClientRect();
    const offsetTop = props.offsetTop !== undefined ? props.offsetTop : 4;
    let tooltipX = x + width / 2.0;
    let tooltipY = -9999; // send it off screen for measuring before showing it

    tooltipStore.set(text, { x: tooltipX, y: tooltipY });

    // measure tooltip after render
    requestAnimationFrame(() => {
      const tooltipElement = document.getElementById("hoverable-tooltip");
      if (!tooltipElement) return console.info("no tooltip found");

      const tooltipRect = tooltipElement.getBoundingClientRect();
      // const viewportWidth = window.innerWidth;

      if (y - tooltipRect.height - offsetTop < 0) {
        tooltipY = Math.max(tooltipY, y + height + offsetTop + tooltipRect.height);
      } else {
        tooltipY = y - offsetTop;
      }

      if (tooltipRect.x < 0 || x + tooltipRect.x < 0) {
        tooltipX = x + tooltipRect.width / 2;
      } else if (tooltipRect.x + tooltipRect.width + 5 > window.innerWidth) {
        tooltipX = x - tooltipRect.width / 2 - 10;
      }

      tooltipStore.moveTo({ x: tooltipX, y: tooltipY });
    });
  }

  function hideTooltip() {
    tooltipStore.clear();
  }

  useEffect(() => {
    return () => hideTooltip();
  }, []);

  function handleMouseEnter(_e: React.MouseEvent) {
    if (props.tooltipText) showTooltip(elementRef.current, props.tooltipText);
  }

  function handleFocus(_e: React.FocusEvent): void {
    if (props.tooltipText) showTooltip(elementRef.current, props.tooltipText);
  }

  return (
    <div
      className={`h-fit w-fit ${props.extraStyles} p-0`}
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
      onFocus={handleFocus}
      onBlur={hideTooltip}
      tabIndex={0}
    >
      {props.children}
    </div>
  );
}
