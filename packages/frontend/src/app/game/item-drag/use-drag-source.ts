import { useClientApplication } from "@/hooks/create-client-application-context";
import { DragSource } from "@/client-application/item-drag/types";
import { DRAG_START_THRESHOLD_PX } from "@/client-consts";
import { PointerEvent as ReactPointerEvent, useRef } from "react";

// Arms a drag on pointer-down and begins it once the pointer travels past a small threshold, so a
// plain click still reaches the element's own onClick. `getSource` runs at begin time and may
// return null to cancel (e.g. the character isn't controlled by this player).
export function useDragSource(getSource: () => DragSource | null) {
  const { dragService } = useClientApplication();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(event: ReactPointerEvent) {
    if (event.button !== 0) {
      return;
    }
    startRef.current = { x: event.clientX, y: event.clientY };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
  }

  function onPointerMove(event: PointerEvent) {
    const start = startRef.current;
    if (start === null) {
      return;
    }
    const traveled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (traveled < DRAG_START_THRESHOLD_PX) {
      return;
    }

    const source = getSource();
    cleanup();
    if (source !== null) {
      dragService.begin(source, { x: event.clientX, y: event.clientY });
    }
  }

  function cleanup() {
    startRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", cleanup);
  }

  return { onPointerDown };
}
