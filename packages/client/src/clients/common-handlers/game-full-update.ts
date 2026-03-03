import { HTTP_REQUEST_NAMES } from "@/client-consts";
import { GameWorldView } from "@/game-world-view";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { ActionMenuStore } from "@/mobx-stores/action-menu";
import { GameStore } from "@/mobx-stores/game";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { SpeedDungeonGame } from "@speed-dungeon/common";

export function gameFullUpdateHandler(
  game: SpeedDungeonGame | null,
  gameStore: GameStore,
  actionMenuStore: ActionMenuStore,
  gameWorldView: { current: GameWorldView | null }
) {
  if (game) {
    const deserialized = SpeedDungeonGame.getDeserialized(game);
    deserialized.makeObservable();
    game = deserialized;
  } else {
    gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ClearAllModels,
    });
  }

  gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
    placeInHomePositions: true,
  });
  gameWorldView.current?.imageManager.enqueueMessage({
    type: ImageManagerRequestType.ClearState,
  });

  const currentSessionHttpResponseTracker =
    useHttpRequestStore.getState().requests[HTTP_REQUEST_NAMES.GET_SESSION];
  const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;

  if (game === null) {
    gameStore.clearGame();
    if (isLoggedIn) {
      gameWorldView.current?.drawCharacterSlots();
    }
  } else {
    gameStore.setGame(game);
  }

  actionMenuStore.clearStack();
}
