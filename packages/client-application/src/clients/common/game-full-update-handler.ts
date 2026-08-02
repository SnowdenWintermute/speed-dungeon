import { ClientApplication } from "@/client-application";
import { ClientSequentialEventType, SerializedOf, SpeedDungeonGame } from "@speed-dungeon/common";

export function gameFullUpdateHandler(
  clientApplication: ClientApplication,
  game: SerializedOf<SpeedDungeonGame> | null
) {
  let deserializedGame: null | SpeedDungeonGame = null;
  if (game) {
    deserializedGame = SpeedDungeonGame.fromSerialized(game);
    deserializedGame.initializeBattlesOnDeserialization();
    deserializedGame.makeObservable();
  } else {
    clientApplication.sequentialEventProcessor.scheduleEvent({
      type: ClientSequentialEventType.ClearAllModels,
      data: undefined,
    });
  }

  if (deserializedGame === null) {
    clientApplication.gameContext.clearGame();
    if (clientApplication.session.isLoggedIn) {
      clientApplication.gameWorldView?.environment.groundPlane.drawCharacterSlots();
    }
  } else {
    clientApplication.gameContext.setGame(deserializedGame);
  }

  clientApplication.sequentialEventProcessor.scheduleEvent({
    type: ClientSequentialEventType.SynchronizeCombatantModels,
    data: { softCleanup: true, placeInHomePositions: true },
  });

  // a GameFullUpdate (e.g. reconnection) re-deserializes persistent action entities like a firewall
  // into the party but leaves the scene without their models, so respawn any that are missing
  clientApplication.sequentialEventProcessor.scheduleEvent({
    type: ClientSequentialEventType.SynchronizeActionEntityModels,
    data: undefined,
  });

  clientApplication.actionMenu.clearStack();
}
