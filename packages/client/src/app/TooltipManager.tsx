import { useUIStore } from "@/stores/ui-store";
import React, { useRef } from "react";
import { ZIndexLayers } from "./z-index-layers";

export default function TooltipManager() {
  const tooltipText = useUIStore().tooltipText;
  const tooltipPosition = useUIStore().tooltipPosition;
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (tooltipPosition === null) return <></>;
  const { x, y } = tooltipPosition;

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
        {tooltipText}
      </div>
    </div>
  );
}
