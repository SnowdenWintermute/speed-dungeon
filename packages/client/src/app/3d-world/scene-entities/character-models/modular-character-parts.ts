import { CombatantClass, MonsterType } from "@speed-dungeon/common";

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
    [ModularCharacterPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [ModularCharacterPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [ModularCharacterPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
  },
  [CombatantClass.Rogue]: {
    [ModularCharacterPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [ModularCharacterPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [ModularCharacterPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
    // [ModularCharacterPartCategory.Head]: "humanoid/midieval/midieval-head.glb",
    // [ModularCharacterPartCategory.Torso]: "humanoid/midieval/midieval-torso.glb",
    // [ModularCharacterPartCategory.Legs]: "humanoid/midieval/midieval-legs.glb",
  },
  [CombatantClass.Mage]: {
    [ModularCharacterPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [ModularCharacterPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [ModularCharacterPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
    // [ModularCharacterPartCategory.Head]: "humanoid/witch/witch-head.glb",
    // [ModularCharacterPartCategory.Torso]: "humanoid/witch/witch-torso.glb",
    // [ModularCharacterPartCategory.Legs]: "humanoid/witch/witch-legs.glb",
  },
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
