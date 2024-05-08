import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { GameListEntry } from "common/src/packets/server-to-client";

type LobbyState = {
  username: undefined | string;
  gameList: GameListEntry[];
  mutateState: (fn: (state: LobbyState) => void) => void;
};

export const useLobbyStore = create<LobbyState>()(
  immer(
    devtools(
      (set, _get) => ({
        username: undefined,
        gameList: [],
        mutateState: (fn: (state: LobbyState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "lobby store" }
    )
  )
);
