import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

type CatState = {
  cats: {
    bigCats: number;
    smallCats: number;
  };
  increaseBigCats: () => void;
  increaseSmallCats: () => void;
  summary: () => string;
  mutateState: (fn: (state: CatState) => void) => void;
};

export const useCatStore = create<CatState>()(
  immer(
    devtools(
      (set, get) => ({
        cats: {
          bigCats: 0,
          smallCats: 0,
        },

        increaseBigCats: () =>
          set((state) => {
            state.cats.bigCats += 1;
          }),
        increaseSmallCats: () =>
          set((state) => {
            state.cats.smallCats += 1;
          }),
        summary: () => {
          const total = get().cats.bigCats + get().cats.smallCats;
          return `There are ${total} cats`;
        },
        mutateState: (fn: (state: CatState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "cat store" }
    )
  )
);
