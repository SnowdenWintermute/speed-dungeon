import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
} from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
} from "../combatant-models/modular-character-parts";

export default function handleMessageFromNext(this: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.SpawnCombatantModel:
      const parts = [];
      if (message.combatant.monsterType !== null) {
        parts.push({
          category: ModularCharacterPartCategory.Full,
          assetPath: MONSTER_FULL_SKINS[message.combatant.monsterType] || "",
        });
      } else {
        // is humanoid
        let headPath =
          CHARACTER_PARTS[message.combatant.class][ModularCharacterPartCategory.Head] || "";
        let torsoPath =
          CHARACTER_PARTS[message.combatant.class][ModularCharacterPartCategory.Torso] || "";
        let legsPath =
          CHARACTER_PARTS[message.combatant.class][ModularCharacterPartCategory.Legs] || "";
        parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
        parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
        parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
      }

      this.spawnCharacterModel(
        message.combatant.species,
        parts,
        message.combatant.startPosition,
        message.combatant.startRotation
      );
      break;
    case NextToBabylonMessageTypes.RemoveCombatantModel:
      break;
  }
}
