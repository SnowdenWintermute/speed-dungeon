import { useUIStore } from "@/stores/ui-store";
import React, { useEffect } from "react";

export default function GlobalKeyboardEventManager() {
  const mutateUiState = useUIStore().mutateState;

  function keypressHandler(e: KeyboardEvent) {
    // if (e.code === "KeyQ") e.preventDefault();
  }

  function keydownEventHandler(e: KeyboardEvent) {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight")
      mutateUiState((uiState) => {
        uiState.modKeyHeld = true;
      });
  }
  function keyupEventHandler(e: KeyboardEvent) {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight")
      mutateUiState((uiState) => {
        uiState.modKeyHeld = false;
      });
  }

  useEffect(() => {
    window.addEventListener("keyup", keyupEventHandler);
    window.addEventListener("keydown", keydownEventHandler);
    window.addEventListener("keypress", keypressHandler);
    return () => {
      window.removeEventListener("keyup", keyupEventHandler);
      window.removeEventListener("keydown", keydownEventHandler);
      window.removeEventListener("keypress", keypressHandler);
    };
  }, []);

  return <></>;
}
