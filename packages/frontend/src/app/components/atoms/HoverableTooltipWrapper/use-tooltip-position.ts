import { Point } from "@speed-dungeon/common";
import { RefObject, useLayoutEffect } from "react";

// the tooltip renders offscreen first so it can be measured, then moves to its real position
export const UNMEASURED_TOOLTIP_Y = -9999;

export function anchorTooltipTo(anchor: HTMLElement): Point {
  const { x, width } = anchor.getBoundingClientRect();
  return { x: x + width / 2.0, y: UNMEASURED_TOOLTIP_Y };
}

export function useTooltipPosition(
  anchorRef: RefObject<HTMLElement | null>,
  tooltipRef: RefObject<HTMLElement | null>,
  position: null | Point,
  offsetTop: number,
  onMeasured: (position: Point) => void
) {
  useLayoutEffect(() => {
    if (position === null || position.y !== UNMEASURED_TOOLTIP_Y) {
      return;
    }
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) {
      return;
    }

    const { x, y, width, height } = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let tooltipX = x + width / 2.0;
    let tooltipY: number;

    if (y - tooltipRect.height - offsetTop < 0) {
      tooltipY = y + height + offsetTop + tooltipRect.height;
    } else {
      tooltipY = y - offsetTop;
    }

    if (tooltipRect.x < 0 || x + tooltipRect.x < 0) {
      tooltipX = x + tooltipRect.width / 2;
    } else if (tooltipRect.x + tooltipRect.width + 5 > window.innerWidth) {
      tooltipX = x - tooltipRect.width / 2 - 10;
    }

    onMeasured({ x: tooltipX, y: tooltipY });
  }, [position, offsetTop]);
}
