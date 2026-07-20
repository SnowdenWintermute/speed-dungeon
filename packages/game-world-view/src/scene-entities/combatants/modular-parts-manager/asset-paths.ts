import { CombatantProperties, getMonsterCombatantClass } from "@speed-dungeon/common";
import { CHARACTER_PARTS, CharacterModelPartCategory, MONSTER_FULL_SKINS } from "./modular-parts";
import { Artist } from "../../artists";

export function getCombatantSceneEntityPartCategoriesAndAssetPaths(
  combatantProperties: CombatantProperties
) {
  const parts: {
    category: CharacterModelPartCategory;
    assetPath: string | undefined;
    artist: Artist | null;
  }[] = [];

  const { monsterType } = combatantProperties;
  const fullSkinOption = monsterType !== null ? MONSTER_FULL_SKINS[monsterType] : null;

  if (fullSkinOption !== null) {
    parts.push({
      category: CharacterModelPartCategory.Full,
      assetPath: fullSkinOption.path,
      artist: fullSkinOption.artist,
    });
    return parts;
  }

  const combatantClass =
    monsterType !== null
      ? getMonsterCombatantClass(monsterType)
      : combatantProperties.classProgressionProperties.getMainClass().combatantClass;

  const classParts = CHARACTER_PARTS[combatantClass];

  for (const category of [
    CharacterModelPartCategory.Head,
    CharacterModelPartCategory.Torso,
    CharacterModelPartCategory.Legs,
  ]) {
    const partOption = classParts[category];
    parts.push({
      category,
      assetPath: partOption?.path,
      artist: partOption?.artist ?? null,
    });
  }

  return parts;
}
