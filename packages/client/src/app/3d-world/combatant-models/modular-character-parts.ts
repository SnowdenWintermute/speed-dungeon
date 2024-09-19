import { CombatantClass, CombatantSpecies } from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common/src/monsters/monster-types";

export enum ModularCharacterPartCategory {
  Head,
  Torso,
  Legs,
  Full,
}

export type ModularCharacterPart = {
  category: ModularCharacterPartCategory;
  assetPath: string;
};

export const BASE_FILE_PATH = process.env.NEXT_PUBLIC_ASSET_BASE_PATH_3D;

export const CHARACTER_PARTS: Record<
  CombatantClass,
  Partial<Record<ModularCharacterPartCategory, string>>
> = {
  [CombatantClass.Warrior]: {
    [ModularCharacterPartCategory.Head]: "adventurer-head.glb",
    [ModularCharacterPartCategory.Torso]: "adventurer-torso.glb",
    [ModularCharacterPartCategory.Legs]: "adventurer-legs.glb",
  },
  [CombatantClass.Rogue]: {
    [ModularCharacterPartCategory.Head]: "midieval-head.glb",
    [ModularCharacterPartCategory.Torso]: "midieval-torso.glb",
    [ModularCharacterPartCategory.Legs]: "midieval-legs.glb",
  },
  [CombatantClass.Mage]: {
    [ModularCharacterPartCategory.Head]: "witch-head.glb",
    [ModularCharacterPartCategory.Torso]: "witch-torso.glb",
    [ModularCharacterPartCategory.Legs]: "witch-legs.glb",
  },
};

export const SKELETONS: Partial<Record<CombatantSpecies, string>> = {
  [CombatantSpecies.Humanoid]: "humanoid-skeleton.glb",
  [CombatantSpecies.Wasp]: "monsters/wasp-main-skeleton.glb",
  [CombatantSpecies.Frog]: "monsters/frog-main-skeleton.glb",
  [CombatantSpecies.Dragon]: "monsters/dragon-main-skeleton.glb",
  [CombatantSpecies.Skeleton]: "monsters/skeleton-main-skeleton.glb",
  [CombatantSpecies.Velociraptor]: "monsters/velociraptor-main-skeleton.glb",
  [CombatantSpecies.Elemental]: "monsters/cube-main-skeleton.glb",
  [CombatantSpecies.Golem]: "monsters/wolf-main-skeleton.glb",
};

export const MONSTER_FULL_SKINS: Partial<Record<MonsterType, string>> = {
  [MonsterType.MetallicGolem]: "monsters/wolf-full.glb",
  [MonsterType.Zombie]: "monsters/skeleton-full.glb",
  [MonsterType.SkeletonArcher]: "monsters/skeleton-full.glb",
  [MonsterType.Scavenger]: "monsters/velociraptor-full.glb",
  [MonsterType.Vulture]: "monsters/dragon-full.glb",
  // [MonsterType.FireMage]: "monsters/",
  // [MonsterType.Cultist]: "monsters/",
  [MonsterType.FireElemental]: "monsters/cube-full.glb",
  [MonsterType.IceElemental]: "monsters/cube-full.glb",
};
