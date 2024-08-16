import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
} from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { ModelManagerMessageType } from "./model-manager";

export default function handleMessageFromNext(this: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.SpawnCombatantModel:
      this.modelManager.enqueueMessage(message.combatantModelBlueprint.entityId, {
        type: ModelManagerMessageType.SpawnModel,
        blueprint: message.combatantModelBlueprint,
      });
      break;
    case NextToBabylonMessageTypes.RemoveCombatantModel:
      this.modelManager.enqueueMessage(message.entityId, {
        type: ModelManagerMessageType.DespawnModel,
      });
      break;
    case NextToBabylonMessageTypes.NewTurnResults:
      // hold them and check each frame if we are ready to process a new turn
      // because we may get multiple turn results at once but only want to play
      // them one at a time
      this.turnResultsQueue.push(...message.turnResults);
      break;
    case NextToBabylonMessageTypes.NewActionResults:
      // give the action results directly to the corresponding models' queues
      // because these are "instant" actions like using a consumable out of combat
      // and we don't mind playing multiple character's actions at the same time
      for (const actionResult of message.actionResults) {
        const combatantModelOption = this.modelManager.combatantModels[actionResult.userId];
        if (combatantModelOption === undefined)
          return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        combatantModelOption.actionResultsQueue.push(...message.actionResults);
      }
      break;
    // case NextToBabylonMessageTypes.SetCombatantDomRef:
    //   console.log("setting combatant dom ref");
    //   const combatantModel = this.combatantModels[message.combatantId];
    //   if (!combatantModel) console.log("NO MODEL FOUND");
    //   this.combatantModels[message.combatantId]?.setModelDomPositionRef(
    //     message.babylonModelDomPositionRef
    //   );
    //   break;
  }
}
