import { ClientApplication } from "@/client-application";
import { ClientEventType } from "@/client-application/sequential-client-event-processor/client-events";
import { HTTP_REQUEST_NAMES } from "@/client-consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { ImageGenerationRequestType } from "@/xxNEW-game-world-view/images/image-generator-requests";
import { SerializedOf, SpeedDungeonGame } from "@speed-dungeon/common";

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
      type: ClientEventType.ClearAllModels,
      data: undefined,
    });
  }

  clientApplication.sequentialEventProcessor.scheduleEvent({
    type: ClientEventType.SynchronizeCombatantModels,
    data: { softCleanup: true, placeInHomePositions: true },
  });

  clientApplication.gameWorldView?.imageGenerator.enqueueMessage({
    type: ImageGenerationRequestType.ClearState,
    data: undefined,
  });

  const currentSessionHttpResponseTracker =
    useHttpRequestStore.getState().requests[HTTP_REQUEST_NAMES.GET_SESSION];
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
