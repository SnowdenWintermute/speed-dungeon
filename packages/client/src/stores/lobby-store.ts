import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { GameListEntry } from "@speed-dungeon/common";

export type LobbyState = {
  username: null | string;
  gameList: GameListEntry[];
  usernamesInCurrentChannel: string[];
  mutateState: (fn: (state: LobbyState) => void) => void;
};

export const useLobbyStore = create<LobbyState>()(
  immer(
    devtools(
      (set, _get) => ({
        username: null,
        gameList: [],
        usernamesInCurrentChannel: [],
        mutateState: (fn: (state: LobbyState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "lobby store" }
    )
  )
);
