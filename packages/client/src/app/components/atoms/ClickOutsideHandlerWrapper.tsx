import React, { ReactNode, useEffect, useRef } from "react";

interface Props {
  onClickOutside: () => void;
  isActive: boolean;
  children: ReactNode;
}

export default function ClickOutsideHandlerWrapper({ children, onClickOutside, isActive }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);

  function handleClickOutside(e: MouseEvent) {
    if (elementRef.current && isActive) {
      const menuRect = elementRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) onClickOutside();
    }
  }
  return (
    <div ref={elementRef} className="h-fit">
      {children}
    </div>
  );
}
