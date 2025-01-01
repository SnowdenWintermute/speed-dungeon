import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
} from "@/app/3d-world/combatant-models/modular-character/modular-character-parts";
import { CombatantClass, CombatantProperties, MonsterType } from "@speed-dungeon/common";

export function getModularCharacterPartCategoriesAndAssetPaths(
  combatantProperties: CombatantProperties
) {
  const parts: { category: ModularCharacterPartCategory; assetPath: string | undefined }[] = [];

  if (combatantProperties.monsterType !== null) {
    if (
      combatantProperties.monsterType === MonsterType.FireMage ||
      combatantProperties.monsterType === MonsterType.Cultist
    ) {
      parts.push({
        category: ModularCharacterPartCategory.Head,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Head] || "",
      });
      parts.push({
        category: ModularCharacterPartCategory.Torso,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Torso] || "",
      });
      parts.push({
        category: ModularCharacterPartCategory.Legs,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Legs] || "",
      });
    } else {
      parts.push({
        category: ModularCharacterPartCategory.Full,
        assetPath: MONSTER_FULL_SKINS[combatantProperties.monsterType] || "",
      });
    }
  } else {
    // is humanoid
    let headPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Head];
    let torsoPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Torso];
    let legsPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Legs];
    parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
    parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
    parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
  }

  return parts;
}
