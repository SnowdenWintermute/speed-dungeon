import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/ui-store";

export default function DebugText({ debugRef }: { debugRef: React.RefObject<HTMLUListElement> }) {
  const showDebug = useUIStore((state) => state.showDebug);
  const headerRef = useRef<HTMLDivElement>(null);
  const keydownListenerRef = useRef<(e: KeyboardEvent) => void>();
  const mouseDownListenerRef = useRef<(e: MouseEvent) => void>();
  const mouseUpListenerRef = useRef<(e: MouseEvent) => void>();
  const mouseMoveListenerRef = useRef<(e: MouseEvent) => void>();
  const mousePressedRef = useRef<null | { offsetX: number; offsetY: number }>(null);
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);

  useEffect(() => {
    keydownListenerRef.current = function (e: KeyboardEvent) {
      if (e.code !== "KeyP") return;
      useUIStore.getState().mutateState((state) => {
        state.showDebug = !state.showDebug;
      });
    };

    mouseDownListenerRef.current = function (e: MouseEvent) {
      const headerBoundingRect = headerRef.current?.getBoundingClientRect();
      if (!headerBoundingRect) return;
      if (e.x > headerBoundingRect.x + headerBoundingRect.width) return;
      if (e.x < headerBoundingRect.x) return;
      if (e.y < headerBoundingRect.y) return;
      if (e.y > headerBoundingRect.y + headerBoundingRect.height) return;
      mousePressedRef.current = {
        offsetX: e.clientX - headerBoundingRect.x,
        offsetY: e.clientY - headerBoundingRect.y,
      };
    };
    mouseUpListenerRef.current = function () {
      mousePressedRef.current = null;
    };
    mouseMoveListenerRef.current = function (e: MouseEvent) {
      if (!mousePressedRef.current) return;
      const headerBoundingRect = headerRef.current?.getBoundingClientRect();
      if (!headerBoundingRect) return;

      const newX = e.clientX - mousePressedRef.current.offsetX;
      const newY = e.clientY - mousePressedRef.current.offsetY;
      setX(newX);
      setY(newY);
    };

    window.addEventListener("keydown", keydownListenerRef.current);
    window.addEventListener("mousedown", mouseDownListenerRef.current);
    window.addEventListener("mouseup", mouseUpListenerRef.current);
    window.addEventListener("mousemove", mouseMoveListenerRef.current);

    return () => {
      if (keydownListenerRef.current)
        window.removeEventListener("keydown", keydownListenerRef.current);
      if (mouseDownListenerRef.current)
        window.removeEventListener("mousedown", mouseDownListenerRef.current);
      if (mouseUpListenerRef.current)
        window.removeEventListener("mouseup", mouseUpListenerRef.current);
      if (mouseMoveListenerRef.current)
        window.removeEventListener("mousemove", mouseMoveListenerRef.current);
    };
  }, []);

  return (
    <div
      className={`absolute z-50 bottom-10 left-10 flex flex-col ${!showDebug && "hidden"} pointer-events-auto bg-black h-fit border border-white`}
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <div className="cursor-grab border-b border-white flex justify-between" ref={headerRef}>
        <h5 className="p-2 ">DEBUG</h5>
        <button
          className="h-full p-2 border-l border-white"
          onClick={() => {
            useUIStore.getState().mutateState((state) => {
              state.showDebug = false;
            });
          }}
        >
          Hide
        </button>
      </div>
      <ul ref={debugRef} className="p-2"></ul>
    </div>
  );
}