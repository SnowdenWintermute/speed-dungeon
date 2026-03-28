import { CombatantClass, CombatantProperties, MonsterType } from "@speed-dungeon/common";
import { CHARACTER_PARTS, CharacterModelPartCategory, MONSTER_FULL_SKINS } from "./modular-parts";

export function getCombatantSceneEntityPartCategoriesAndAssetPaths(
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
    const mainClass = combatantProperties.classProgressionProperties.getMainClass().combatantClass;
    // is humanoid
    const headPath = CHARACTER_PARTS[mainClass][CharacterModelPartCategory.Head];
    const torsoPath = CHARACTER_PARTS[mainClass][CharacterModelPartCategory.Torso];
    const legsPath = CHARACTER_PARTS[mainClass][CharacterModelPartCategory.Legs];
    parts.push({ category: CharacterModelPartCategory.Head, assetPath: headPath });
    parts.push({ category: CharacterModelPartCategory.Torso, assetPath: torsoPath });
    parts.push({ category: CharacterModelPartCategory.Legs, assetPath: legsPath });
  }

  return parts;
}
