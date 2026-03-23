import { useClientApplication } from "@/hooks/create-client-application-context";
import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  tooltipText?: ReactNode;
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

  function handleFocus() {
    if (props.tooltipText) {
      tooltips.showTooltip(elementRef.current, props.tooltipText);
    }
  }

  function handleBlur() {
    tooltips.hideTooltip();
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
    </div>
  );
}
