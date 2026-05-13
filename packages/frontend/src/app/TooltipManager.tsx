import React, { useRef } from "react";
import { ZIndexLayers } from "./z-index-layers";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const TooltipManager = observer(() => {
  const { text, position } = useClientApplication().uiStore.tooltips.get();
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (position === null) return <></>;
  const { x, y } = position;

  return (
    <div
      className={`absolute`}
      style={{ top: `${y}px`, left: `${x}px`, zIndex: ZIndexLayers.Tooltip }}
      ref={tooltipRef}
    >
      <div
        id="hoverable-tooltip"
        className="border border-slate-400 bg-slate-950 text-zinc-300 p-2 -translate-x-1/2 -translate-y-[100%] max-w-96"
      >
        {text}
      </div>
    </div>
  );
});
