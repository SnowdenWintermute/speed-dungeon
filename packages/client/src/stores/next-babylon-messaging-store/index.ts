import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { MutateState } from "../mutate-state";
import { BabylonToNextMessage } from "./babylon-to-next-messages";

export type NextBabylonMessagingState = {
  babylonToNextMessages: BabylonToNextMessage[];
  mutateState: MutateState<NextBabylonMessagingState>;
};

export const useNextBabylonMessagingStore = create<NextBabylonMessagingState>()(
  immer(
    devtools(
      (set, _get) => ({
        babylonToNextMessages: [],
        mutateState: (fn: (state: NextBabylonMessagingState) => void) => set(produce(fn)),
      }),
      { enabled: false, name: "next babylon messaging store" }
    )
  )
);
