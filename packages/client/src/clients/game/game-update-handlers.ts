import { setAlert } from "@/app/components/alerts";
import { GameWorldView } from "@/game-world-view";
import { AppStore } from "@/mobx-stores/app-store";
import { GameStateUpdateMap, GameStateUpdateType } from "@speed-dungeon/common";

export type GameUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type GameUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: GameUpdateHandler<K>;
};

export function createGameUpdateHandlers(
  appStore: AppStore,
  gameWorldView: {
    current: null | GameWorldView;
  }
): Partial<GameUpdateHandlers> {
  const { lobbyStore, gameStore, actionMenuStore, gameEventNotificationStore } = appStore;
  return {
    [GameStateUpdateType.ErrorMessage]: (data) => {
      setAlert(data.message);
      console.log("alert:", data.message);
    },
  };
}
