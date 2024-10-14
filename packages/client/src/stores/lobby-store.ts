import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Combatant, GameListEntry, UserChannelDisplayData } from "@speed-dungeon/common";

export type LobbyState = {
  websocketConnected: boolean;
  gameList: GameListEntry[];
  mainChannelName: string;
  usersInMainChannel: { [username: string]: UserChannelDisplayData };
  showAuthForm: boolean;
  highlightAuthForm: boolean;
  savedCharacters: { [slot: number]: Combatant | null };
  mutateState: (fn: (state: LobbyState) => void) => void;
};

export const useLobbyStore = create<LobbyState>()(
  immer(
    devtools(
      (set, _get) => ({
        websocketConnected: false,
        gameList: [],
        mainChannelName: "",
        usersInMainChannel: {},
        showAuthForm: true,
        highlightAuthForm: false,
        savedCharacters: {},
        mutateState: (fn: (state: LobbyState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "lobby store" }
    )
  )
);
