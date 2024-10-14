import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";
import { GameWorld } from ".";
import { ModelManagerMessageType } from "./model-manager";
import startMovingIntoCombatActionUsePosition from "./start-moving-into-combat-action-use-position";
import startPerformingCombatAction from "./start-performing-combat-action";
import startReturningHome from "./start-returning-home";

export default function processMessagesFromNext(this: GameWorld) {
  // console.log("messages: ", nextToBabylonMessageQueue.messages);
  if (nextToBabylonMessageQueue.messages.length > 0) {
    const message = nextToBabylonMessageQueue.messages.shift();
    console.log("processing message: ", message);
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
        checkIfRoomLoaded: message.checkIfRoomLoaded,
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
    case NextToBabylonMessageTypes.StartReturningHome:
      return startReturningHome(gameWorld, message);
    case NextToBabylonMessageTypes.MoveCamera:
      if (!gameWorld.camera) return;
      const { radius, target, alpha, beta } = message;
      gameWorld.camera.radius = radius;
      gameWorld.camera.target = target;
      gameWorld.camera.alpha = alpha;
      gameWorld.camera.beta = beta;
  }
}
