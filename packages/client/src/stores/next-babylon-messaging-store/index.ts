import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { MutateState } from "../mutate-state";
import { NextToBabylonMessage } from "./next-to-babylon-messages";
import { BabylonToNextMessage } from "./babylon-to-next-messages";

export type NextBabylonMessagingState = {
  nextToBabylonMessages: NextToBabylonMessage[];
  babylonToNextMessages: BabylonToNextMessage[];
  mutateState: MutateState<NextBabylonMessagingState>;
};

export const useNextBabylonMessagingStore = create<NextBabylonMessagingState>()(
  immer(
    devtools(
      (set, _get) => ({
        nextToBabylonMessages: [],
        babylonToNextMessages: [],
        mutateState: (fn: (state: NextBabylonMessagingState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "next babylon messaging store" }
    )
  )
);
