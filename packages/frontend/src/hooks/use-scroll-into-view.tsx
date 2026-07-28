"use client";
import { useCallback, useRef } from "react";

// for a control that changes how much content sits under it: a table that gains or loses rows moves
// everything below it, and the reader is left looking at a different part of the page than the one
// they just acted on. scrolling the control to the top of the scrolling region puts it back.
// scrollIntoView walks up to the nearest scrollable ancestor, which is the page column rather than
// the window, so this works without knowing which element scrolls
export function useScrollIntoView<TElement extends HTMLElement>() {
  const ref = useRef<TElement>(null);

  const scrollIntoView = useCallback(() => {
    ref.current?.scrollIntoView({ block: "start" });
  }, []);

  return { ref, scrollIntoView };
}
