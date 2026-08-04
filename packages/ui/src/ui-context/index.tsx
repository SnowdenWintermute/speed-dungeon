import React, { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

// the stacking positions the shared components need. the consuming app owns the full ordering and
// passes only these in, since its other layers are its own business
export interface UiLayers {
  dropdown: number;
  tooltip: number;
}

interface UiContextValue {
  layers: UiLayers;
  hotkeysDisabled: boolean;
  suspendHotkeys: () => () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

function useUiContext(consumerName: string): UiContextValue {
  const value = useContext(UiContext);

  if (!value) {
    throw new Error(`${consumerName} must be used within a UiProvider`);
  }

  return value;
}

export function UiProvider(props: { layers: UiLayers; children: ReactNode }) {
  // a count rather than a flag, because overlapping focus (one input focusing another) would let a
  // single blur re-enable hotkeys while a field is still focused
  const [suspensionCount, setSuspensionCount] = useState(0);

  const suspendHotkeys = useCallback(() => {
    setSuspensionCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      setSuspensionCount((count) => count - 1);
    };
  }, []);

  const { layers } = props;
  const value = useMemo(
    () => ({ layers, hotkeysDisabled: suspensionCount > 0, suspendHotkeys }),
    [layers, suspensionCount, suspendHotkeys]
  );

  return <UiContext.Provider value={value}>{props.children}</UiContext.Provider>;
}

export function useUiLayers(): UiLayers {
  return useUiContext("useUiLayers").layers;
}

export function useHotkeysDisabled(): boolean {
  return useUiContext("useHotkeysDisabled").hotkeysDisabled;
}

export function useSuspendHotkeys(): () => () => void {
  return useUiContext("useSuspendHotkeys").suspendHotkeys;
}
