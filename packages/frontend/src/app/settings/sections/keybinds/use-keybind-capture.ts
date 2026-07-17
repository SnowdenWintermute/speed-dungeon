import { useEffect, useState } from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export function useKeybindCapture() {
  const clientApplication = useClientApplication();
  const { keybinds, inputs } = clientApplication.uiStore;
  const [capturingFor, setCapturingFor] = useState<HotkeyButtonTypes | null>(null);

  useEffect(() => {
    if (capturingFor === null) {
      return;
    }
    const previousHotkeysDisabled = inputs.getHotkeysDisabled();
    inputs.setHotkeysDisabled(true);

    const listener = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code !== "Escape") {
        keybinds.setKeybind(capturingFor, e.code);
      }
      setCapturingFor(null);
    };
    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
      inputs.setHotkeysDisabled(previousHotkeysDisabled);
    };
  }, [capturingFor, inputs, keybinds]);

  function toggleCapture(buttonType: HotkeyButtonTypes) {
    setCapturingFor((current) => (current === buttonType ? null : buttonType));
  }

  return { capturingFor, toggleCapture };
}
