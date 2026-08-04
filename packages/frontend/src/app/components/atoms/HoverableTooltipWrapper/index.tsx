"use client";
import { Point } from "@speed-dungeon/common";
import React, { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUiLayers } from "../ui-context";
import { anchorTooltipTo, useTooltipPosition } from "./use-tooltip-position";

interface Props {
  tooltipText?: ReactNode | (() => ReactNode);
  extraStyles?: string;
  offsetTop?: number;
  children: ReactNode;
}

export default function HoverableTooltipWrapper(props: Props) {
  const { tooltip: tooltipLayer } = useUiLayers();
  const elementRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<null | ReactNode>(null);
  const [position, setPosition] = useState<null | Point>(null);

  useTooltipPosition(elementRef, tooltipRef, position, props.offsetTop ?? 4, setPosition);

  function handleFocus() {
    const { tooltipText } = props;
    if (!tooltipText || !elementRef.current) {
      return;
    }
    setContent(tooltipText instanceof Function ? tooltipText() : tooltipText);
    setPosition(anchorTooltipTo(elementRef.current));
  }

  function handleBlur() {
    setContent(null);
    setPosition(null);
  }

  return (
    <div
      className={`h-fit w-fit ${props.extraStyles} p-0`}
      ref={elementRef}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
    >
      {props.children}
      {position !== null &&
        createPortal(
          <div
            className="absolute"
            style={{ top: `${position.y}px`, left: `${position.x}px`, zIndex: tooltipLayer }}
          >
            <div
              ref={tooltipRef}
              className="border border-theme-muted bg-theme-recessed text-theme-emphasis p-2 -translate-x-1/2 -translate-y-[100%] max-w-96"
            >
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
