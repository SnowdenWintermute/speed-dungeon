import { useEffect, useState } from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { normalizeKeyValue } from "@speed-dungeon/common";
import { useSuspendHotkeys } from "@speed-dungeon/ui/ui-context";

export enum KeybindCaptureMode {
  Assign,
  Add,
}

interface CaptureState {
  buttonType: HotkeyButtonTypes;
  mode: KeybindCaptureMode;
}

export function useKeybindCapture() {
  const clientApplication = useClientApplication();
  const { keybinds } = clientApplication.uiStore;
  const suspendHotkeys = useSuspendHotkeys();
  const [capturing, setCapturing] = useState<CaptureState | null>(null);

  useEffect(() => {
    if (capturing === null) {
      return;
    }
    const releaseHotkeys = suspendHotkeys();

    const listener = (e: KeyboardEvent) => {
      e.preventDefault();
      if (normalizeKeyValue(e.key) !== "escape") {
        if (capturing.mode === KeybindCaptureMode.Assign) {
          keybinds.setKeybind(capturing.buttonType, e.key);
        } else {
          keybinds.addKeybind(capturing.buttonType, e.key);
        }
      }
      setCapturing(null);
    };
    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
      releaseHotkeys();
    };
  }, [capturing, suspendHotkeys, keybinds]);

  function startCapture(buttonType: HotkeyButtonTypes, mode: KeybindCaptureMode) {
    setCapturing((current) =>
      current !== null && current.buttonType === buttonType && current.mode === mode
        ? null
        : { buttonType, mode }
    );
  }

  return { capturingButtonType: capturing?.buttonType ?? null, startCapture };
}
