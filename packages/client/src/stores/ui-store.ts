import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

export enum UiDisplayMode {
  Detailed,
  Simple,
  Sparse,
}

export const UI_DISPLAY_MODE_STRINGS: Record<UiDisplayMode, string> = {
  [UiDisplayMode.Detailed]: "Detailed",
  [UiDisplayMode.Simple]: "Simple",
  [UiDisplayMode.Sparse]: "Sparse",
};

export type UIState = {
  authFormEmailField: string;
  threatTableDetailedDisplayMode: UiDisplayMode;
  mutateState: (fn: (state: UIState) => void) => void;
  setAuthFormEmailField: (email: string) => void;
};

export const useUIStore = create<UIState>()(
  immer(
    devtools(
      (set, _get) => ({
        authFormEmailField: "",
        threatTableDetailedDisplayMode: UiDisplayMode.Simple,
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
