import { useEffect } from "react";
import { normalizeKeyValue } from "@speed-dungeon/common";

interface Options {
  hotkeys: undefined | string[];
  disabled: boolean;
  onActivate: () => void;
  keyUp?: boolean;
}

export function useHotkeys({ hotkeys, disabled, onActivate, keyUp }: Options) {
  const listenerType = keyUp ? "keyup" : "keydown";

  useEffect(() => {
    if (hotkeys === undefined) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        if (disabled || normalizeKeyValue(event.key) !== normalizeKeyValue(hotkey)) {
          continue;
        }
        // consume the keystroke so it can't also be typed into an input that this
        // action focuses (e.g. opening a modal whose field auto-focuses)
        event.preventDefault();
        onActivate();
      }
    };

    window.addEventListener(listenerType, listener);
    return () => window.removeEventListener(listenerType, listener);
  }, [hotkeys, disabled, listenerType, onActivate]);
}
