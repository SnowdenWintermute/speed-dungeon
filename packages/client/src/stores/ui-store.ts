import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Point } from "@speed-dungeon/common";

export type UIState = {
  modKeyHeld: boolean;
  alternateClickKeyHeld: boolean;
  tooltipPosition: null | Point;
  tooltipText: null | string;
  authFormEmailField: string;
  showSettings: boolean;
  hotkeysDisabled: boolean;
  showDebug: boolean;
  threatTableDetailedDisplayMode: boolean;
  mutateState: (fn: (state: UIState) => void) => void;
  setAuthFormEmailField: (email: string) => void;
};

export const useUIStore = create<UIState>()(
  immer(
    devtools(
      (set, _get) => ({
        modKeyHeld: false,
        alternateClickKeyHeld: false,
        tooltipPosition: null,
        tooltipText: null,
        authFormEmailField: "",
        showSettings: false,
        hotkeysDisabled: false,
        showDebug: false,
        threatTableDetailedDisplayMode: false,
        mutateState: (fn: (state: UIState) => void) => set(produce(fn)),
        setAuthFormEmailField: (email: string) => {
          set((state) => {
            return { ...state, authFormEmailField: email };
          });
        },
      }),
      { enabled: true, name: "UI store" }
    )
  )
);
