import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

export type UIState = {
  modKeyHeld: boolean;
  tooltipPosition: null | [number, number];
  tooltipText: null | string;
  mutateState: (fn: (state: UIState) => void) => void;
};

export const useUIStore = create<UIState>()(
  immer(
    devtools(
      (set, _get) => ({
        modKeyHeld: false,
        tooltipPosition: null,
        tooltipText: null,
        mutateState: (fn: (state: UIState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "UI store" }
    )
  )
);
