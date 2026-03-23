import {
  CleanupMode,
  ClientIntentType,
  ClientSequentialEventType,
  GameStateUpdate,
  invariant,
} from "@speed-dungeon/common";
import { BaseClient } from "../base";
import { createGameUpdateHandlers } from "./update-handlers";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { ConnectionStatus } from "@/client-application/ui/connection-status";

export class GameClient extends BaseClient {
  private updateHandlers = createGameUpdateHandlers(this.clientApplication);

  protected handleMessage(message: GameStateUpdate) {
    const handlerOption = this.updateHandlers[message.type];
    invariant(handlerOption !== undefined, `Unhandled update type: ${JSON.stringify(message)}`);

    try {
      handlerOption(message.data as never);
    } catch (error) {
      this.clientApplication.alertsService.setAlert(error as Error);
      console.trace(error);
    }
  }

  resetConnection(): void {
    //
  }

  leaveGame() {
    const {
      combatantFocus,
      uiStore,
      gameContext,
      gameWorldView,
      targetIndicatorStore,
      replayTreeScheduler,
      sequentialEventProcessor,
    } = this.clientApplication;

    const { dialogs, connectionStatus } = uiStore;
    const { party } = combatantFocus.requireFocusedCharacterContext();

    dialogs.close(DialogElementName.LeaveGame);

    const { actionEntityManager } = party;
    for (const [entityId, entity] of actionEntityManager.getActionEntities()) {
      actionEntityManager.unregisterActionEntity(entity.entityProperties.id);
      gameWorldView?.sceneEntityService.actionEntityManager.unregister(
        entity.entityProperties.id,
        CleanupMode.Soft
      );
    }

    party.combatantManager.iterateAllCombatants().forEach((combatant) => {
      combatant.combatantProperties.targetingProperties.clear();
    });

    targetIndicatorStore.clear();

    gameContext.clearGame();

    this.dispatchIntent({
      type: ClientIntentType.LeaveGame,
      data: undefined,
    });
    this.close();
    connectionStatus.connectionStatus = ConnectionStatus.Initializing;

    replayTreeScheduler.clear();
    sequentialEventProcessor.cancelQueued();

    sequentialEventProcessor.scheduleEvent({
      type: ClientSequentialEventType.SynchronizeCombatantModels,
      data: { softCleanup: false, placeInHomePositions: true },
    });

    gameWorldView?.environment.groundPlane.drawCharacterSlots();
  }
}
