import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DragPreview } from "./DragPreview";

// Owns the window-level pointer handling for an active drag and the click-suppression that keeps a
// drag-release from also firing the source element's onClick. Renders the cursor-following preview.
export const DragLayer = observer(() => {
  const { dragService } = useClientApplication();
  const isDragging = dragService.isDragging();
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    // a fresh press starts a new gesture, so any pending suppression is stale
    function onPointerDownCapture() {
      suppressNextClickRef.current = false;
    }
    // swallow the click the browser emits right after a drag-release
    function onClickCapture(event: MouseEvent) {
      if (suppressNextClickRef.current) {
        event.stopPropagation();
        event.preventDefault();
        suppressNextClickRef.current = false;
      }
    }
    window.addEventListener("pointerdown", onPointerDownCapture, true);
    window.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDownCapture, true);
      window.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    function onPointerMove(event: PointerEvent) {
      dragService.setPointerPosition({ x: event.clientX, y: event.clientY });
    }
    function onPointerUp() {
      dragService.completeDrop();
      suppressNextClickRef.current = true;
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return isDragging ? <DragPreview /> : null;
});
