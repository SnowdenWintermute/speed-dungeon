import { ModifierKey } from "@/client-application/ui/inputs";
import { useClientApplication } from "@/hooks/create-client-application-context";
import React, { useEffect } from "react";

const ALTERNATE_CLICK_KEY_CODES = ["MetaRight", "MetaLeft", "ControlLeft", "ControlRight"];
const MOD_KEY_CODES = ["ShiftLeft", "ShiftRight"];

export default function GlobalKeyboardEventManager() {
  const clientApplication = useClientApplication();
  const { inputs } = clientApplication.uiStore;

  function keydownEventHandler(e: KeyboardEvent) {
    if (ALTERNATE_CLICK_KEY_CODES.includes(e.code)) {
      inputs.setKeyHeld(ModifierKey.AlternateClick);
    }

    if (MOD_KEY_CODES.includes(e.code)) {
      inputs.setKeyHeld(ModifierKey.Mod);
    }

    // try to stop Firefox Quick Find when not typing in a text input
    if (e.code === "KeyQ" && !typingFieldIsFocused()) {
      e.preventDefault();
    }
  }

  function keyupEventHandler(e: KeyboardEvent) {
    if (ALTERNATE_CLICK_KEY_CODES.includes(e.code)) {
      inputs.setKeyReleased(ModifierKey.AlternateClick);
    }
    if (MOD_KEY_CODES.includes(e.code)) {
      inputs.setKeyReleased(ModifierKey.Mod);
    }
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

function typingFieldIsFocused() {
  const el = document.activeElement;
  if (!el) return false;

  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") {
    return true;
  }

  // Narrow to HTMLElement to access isContentEditable
  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }

  return false;
}
