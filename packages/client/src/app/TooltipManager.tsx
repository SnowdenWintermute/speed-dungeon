import { useUIStore } from "@/stores/ui-store";
import React, { useRef } from "react";

export default function TooltipManager() {
  const tooltipText = useUIStore().tooltipText;
  const tooltipPosition = useUIStore().tooltipPosition;
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (tooltipPosition === null) return <></>;
  const { x, y } = tooltipPosition;
  return (
    <div className="absolute z-40" style={{ top: `${y}px`, left: `${x}px` }} ref={tooltipRef}>
      <div className="border border-slate-400 bg-slate-950 text-zinc-300 p-2 -translate-x-1/2 -translate-y-[100%]">
        {tooltipText}
      </div>
    </div>
  );
}
