import { ClientApplication } from "@/client-application";
import { HTTP_REQUEST_NAMES } from "@/client-consts";
import { ImageGenerationRequestType } from "@/game-world-view/images/image-generator-requests";
import { ClientSequentialEventType, SerializedOf, SpeedDungeonGame } from "@speed-dungeon/common";

export function gameFullUpdateHandler(
  clientApplication: ClientApplication,
  game: SerializedOf<SpeedDungeonGame> | null
) {
  let deserializedGame: null | SpeedDungeonGame = null;
  if (game) {
    deserializedGame = SpeedDungeonGame.fromSerialized(game);
    deserializedGame.makeObservable();
  } else {
    clientApplication.sequentialEventProcessor.scheduleEvent({
      type: ClientSequentialEventType.ClearAllModels,
      data: undefined,
    });

    clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
      type: ImageGenerationRequestType.ClearState,
      data: undefined,
    });
  }

  clientApplication.sequentialEventProcessor.scheduleEvent({
    type: ClientSequentialEventType.SynchronizeCombatantModels,
    data: { softCleanup: true, placeInHomePositions: true },
  });

  clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
    type: ImageGenerationRequestType.ClearState,
    data: undefined,
  });

  const currentSessionHttpResponseTracker =
    clientApplication.uiStore.httpRequests.requests[HTTP_REQUEST_NAMES.GET_SESSION];
  const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;

  if (deserializedGame === null) {
    clientApplication.gameContext.clearGame();
    if (isLoggedIn) {
      clientApplication.gameWorldView?.environment.groundPlane.drawCharacterSlots();
    }
  } else {
    clientApplication.gameContext.setGame(deserializedGame);
  }

  clientApplication.actionMenu.clearStack();
}
