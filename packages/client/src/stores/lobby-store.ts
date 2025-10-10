import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

export type LobbyState = {
  websocketConnected: boolean;
  mutateState: (fn: (state: LobbyState) => void) => void;
};

export const useLobbyStore = create<LobbyState>()(
  immer(
    devtools(
      (set, _get) => ({
        websocketConnected: false,
        mutateState: (fn: (state: LobbyState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "lobby store" }
    )
  )
);
