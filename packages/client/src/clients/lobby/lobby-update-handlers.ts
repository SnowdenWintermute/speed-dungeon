import { AppStore } from "@/mobx-stores/app-store";
import { GameStateUpdateMap, GameStateUpdateType } from "@speed-dungeon/common";

export type LobbyUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type LobbyUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: LobbyUpdateHandler<K>;
};

export function createLobbyUpdateHandlers(): Partial<LobbyUpdateHandlers> {
  return {
    [GameStateUpdateType.OnConnection]: (data) => {
      console.log("got on connection");
      AppStore.get().gameStore.setUsername(data.username);
    },
  };
}
