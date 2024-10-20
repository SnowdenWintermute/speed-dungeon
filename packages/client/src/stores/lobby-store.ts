import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { GameListEntry, UserChannelDisplayData } from "@speed-dungeon/common";

export type LobbyState = {
  gameList: GameListEntry[];
  mainChannelName: string;
  usersInMainChannel: { [username: string]: UserChannelDisplayData };
  showAuthForm: boolean;
  highlightAuthForm: boolean;
  mutateState: (fn: (state: LobbyState) => void) => void;
};

export const useLobbyStore = create<LobbyState>()(
  immer(
    devtools(
      (set, _get) => ({
        gameList: [],
        mainChannelName: "",
        usersInMainChannel: {},
        showAuthForm: true,
        highlightAuthForm: false,
        mutateState: (fn: (state: LobbyState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "lobby store" }
    )
  )
);
