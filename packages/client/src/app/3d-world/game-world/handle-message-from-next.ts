import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
} from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import {
  CHARACTER_PARTS,
  ModularCharacterPart,
} from "../modular-character/modular-character-parts";

export default function handleMessageFromNext(this: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.SpawnCombatantModel:
      let headPath = CHARACTER_PARTS[message.combatant.class][ModularCharacterPart.Head];
      let torsoPath = CHARACTER_PARTS[message.combatant.class][ModularCharacterPart.Torso];
      let legsPath = CHARACTER_PARTS[message.combatant.class][ModularCharacterPart.Legs];
      this.spawnCharacterModel(
        headPath,
        torsoPath,
        legsPath,
        message.combatant.startPosition,
        message.combatant.startRotation
      );
      break;
    case NextToBabylonMessageTypes.RemoveCombatantModel:
      break;
  }
}
