import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
} from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import handleSpawnCombatantModelMessage from "./spawn-combatant-model";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export default function handleMessageFromNext(this: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.SpawnCombatantModel:
      handleSpawnCombatantModelMessage(this, message.combatantModelBlueprint);
      break;
    case NextToBabylonMessageTypes.RemoveCombatantModel:
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
        const combatantModelOption = this.combatantModels[actionResult.userId];
        if (combatantModelOption === undefined)
          return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        combatantModelOption.actionResultsProcessing.push(...message.actionResults);
      }
      break;
  }
}
