import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

export type UIState = {
  authFormEmailField: string;
  mutateState: (fn: (state: UIState) => void) => void;
  setAuthFormEmailField: (email: string) => void;
};

export const useUIStore = create<UIState>()(
  immer(
    devtools(
      (set, _get) => ({
        authFormEmailField: "",
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
