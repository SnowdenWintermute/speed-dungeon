import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  onClickOutside: () => void;
  isActive: boolean;
  children: ReactNode;
}

export function ClickOutsideHandlerWrapper({ children, onClickOutside, isActive }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    const activatedAt = performance.now();

    function handleClickOutside(e: MouseEvent) {
      // opening from a mousedown handler leaves that mousedown still propagating toward window
      // by the time this listener attaches, and it is not a click outside of anything yet
      if (e.timeStamp <= activatedAt) return;
      if (!elementRef.current) return;

      const menuRect = elementRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) onClickOutside();
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);

  return (
    <div ref={elementRef} className="h-fit">
      {children}
    </div>
  );
}
