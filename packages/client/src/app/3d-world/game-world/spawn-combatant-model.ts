import { CombatantModelBlueprint } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
} from "../combatant-models/modular-character-parts";
import { GameWorld } from ".";

export default function handleSpawnCombatantModelMessage(
  gameWorld: GameWorld,
  combatant: CombatantModelBlueprint
) {
  const parts = [];
  if (combatant.monsterType !== null) {
    parts.push({
      category: ModularCharacterPartCategory.Full,
      assetPath: MONSTER_FULL_SKINS[combatant.monsterType] || "",
    });
  } else {
    // is humanoid
    let headPath = CHARACTER_PARTS[combatant.class][ModularCharacterPartCategory.Head] || "";
    let torsoPath = CHARACTER_PARTS[combatant.class][ModularCharacterPartCategory.Torso] || "";
    let legsPath = CHARACTER_PARTS[combatant.class][ModularCharacterPartCategory.Legs] || "";
    parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
    parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
    parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
  }

  gameWorld.spawnCharacterModel(
    combatant.entityId,
    combatant.species,
    parts,
    combatant.startPosition,
    combatant.startRotation
  );
}
