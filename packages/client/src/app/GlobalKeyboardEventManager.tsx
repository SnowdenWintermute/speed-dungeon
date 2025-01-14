import { useUIStore } from "@/stores/ui-store";
import React, { useEffect } from "react";

export default function GlobalKeyboardEventManager() {
  const mutateUiState = useUIStore().mutateState;

  function keydownEventHandler(e: KeyboardEvent) {
    if (
      e.code === "MetaRight" ||
      e.code === "MetaLeft" ||
      e.code === "ControlLeft" ||
      e.code === "ControlRight"
    ) {
      useUIStore.getState().mutateState((state) => {
        state.alternateClickKeyHeld = true;
      });
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight")
      mutateUiState((uiState) => {
        uiState.modKeyHeld = true;
      });
  }

  function keyupEventHandler(e: KeyboardEvent) {
    if (
      e.code === "MetaRight" ||
      e.code === "MetaLeft" ||
      e.code === "ControlLeft" ||
      e.code === "ControlRight"
    ) {
      useUIStore.getState().mutateState((state) => {
        state.alternateClickKeyHeld = false;
      });
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight")
      mutateUiState((uiState) => {
        uiState.modKeyHeld = false;
      });
  }

  useEffect(() => {
    window.addEventListener("keyup", keyupEventHandler);
    window.addEventListener("keydown", keydownEventHandler);
    return () => {
      window.removeEventListener("keyup", keyupEventHandler);
      window.removeEventListener("keydown", keydownEventHandler);
    };
  }, []);

  return <></>;
}
