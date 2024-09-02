import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
} from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import { ModelManagerMessageType } from "./model-manager";
import startMovingIntoCombatActionUsePosition from "./start-moving-into-combat-action-use-position";
import startPerformingCombatAction from "./start-performing-combat-action";

export default function processMessagesFromNext(this: GameWorld) {
  if (this.messages.length > 0) {
    const message = this.messages.shift();
    if (message !== undefined) {
      const maybeError = handleMessageFromNext(this, message);
      // if (maybeError instanceof Error) {
      //   console.error(maybeError.message);
      //   this.engine.stopRenderLoop();
      // }
    }
  }
}

function handleMessageFromNext(gameWorld: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.SpawnCombatantModel:
      gameWorld.modelManager.enqueueMessage(message.combatantModelBlueprint.entityId, {
        type: ModelManagerMessageType.SpawnModel,
        blueprint: message.combatantModelBlueprint,
      });
      break;
    case NextToBabylonMessageTypes.RemoveCombatantModel:
      gameWorld.modelManager.enqueueMessage(message.entityId, {
        type: ModelManagerMessageType.DespawnModel,
      });
      break;
    case NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition:
      return startMovingIntoCombatActionUsePosition(gameWorld, message);
    case NextToBabylonMessageTypes.StartPerformingCombatAction:
      return startPerformingCombatAction(gameWorld, message);
  }
}
