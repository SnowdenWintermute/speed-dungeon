import { useClientApplication } from "@/hooks/create-client-application-context";
import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  tooltipText?: ReactNode | (() => ReactNode);
  extraStyles?: string;
  offsetTop?: number;
  children: ReactNode;
}

export default function HoverableTooltipWrapper(props: Props) {
  const clientApplication = useClientApplication();
  const { uiStore } = clientApplication;
  const { tooltips } = uiStore;

  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => tooltips.hideTooltip();
  }, []);

  const handleFocus = () => {
    if (props.tooltipText) {
      if (props.tooltipText instanceof Function) {
        tooltips.showTooltip(elementRef.current, props.tooltipText());
      } else {
        tooltips.showTooltip(elementRef.current, props.tooltipText);
      }
    }
  };

  const handleBlur = () => {
    tooltips.hideTooltip();
  };

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
    </div>
  );
}
