import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  CharacterModelPartCategory,
} from "@/app/3d-world/scene-entities/character-models/modular-character-parts";
import { CombatantClass, CombatantProperties, MonsterType } from "@speed-dungeon/common";

export function getCharacterModelPartCategoriesAndAssetPaths(
  combatantProperties: CombatantProperties
) {
  const parts: { category: CharacterModelPartCategory; assetPath: string | undefined }[] = [];

  if (combatantProperties.monsterType !== null) {
    if (
      combatantProperties.monsterType === MonsterType.FireMage ||
      combatantProperties.monsterType === MonsterType.Cultist
    ) {
      parts.push({
        category: CharacterModelPartCategory.Head,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][CharacterModelPartCategory.Head] || "",
      });
      parts.push({
        category: CharacterModelPartCategory.Torso,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][CharacterModelPartCategory.Torso] || "",
      });
      parts.push({
        category: CharacterModelPartCategory.Legs,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][CharacterModelPartCategory.Legs] || "",
      });
    } else {
      parts.push({
        category: CharacterModelPartCategory.Full,
        assetPath: MONSTER_FULL_SKINS[combatantProperties.monsterType] || "",
      });
    }
  } else {
    // is humanoid
    let headPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][CharacterModelPartCategory.Head];
    let torsoPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][CharacterModelPartCategory.Torso];
    let legsPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][CharacterModelPartCategory.Legs];
    parts.push({ category: CharacterModelPartCategory.Head, assetPath: headPath });
    parts.push({ category: CharacterModelPartCategory.Torso, assetPath: torsoPath });
    parts.push({ category: CharacterModelPartCategory.Legs, assetPath: legsPath });
  }

  return parts;
}
