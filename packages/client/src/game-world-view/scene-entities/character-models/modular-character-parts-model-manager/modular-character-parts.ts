import { CombatantClass, MonsterType } from "@speed-dungeon/common";

export enum CharacterModelPartCategory {
  Head,
  Torso,
  Legs,
  Full,
}

export type CharacterModelPart = {
  category: CharacterModelPartCategory;
  assetPath: string;
};

export const BASE_FILE_PATH = process.env.NEXT_PUBLIC_ASSET_BASE_PATH_3D;

export const CHARACTER_PARTS: Record<
  CombatantClass,
  Partial<Record<CharacterModelPartCategory, string>>
> = {
  [CombatantClass.Warrior]: {
    [CharacterModelPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [CharacterModelPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [CharacterModelPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
  },
  [CombatantClass.Rogue]: {
    [CharacterModelPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [CharacterModelPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [CharacterModelPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
    // [CharacterModelPartCategory.Head]: "humanoid/midieval/midieval-head.glb",
    // [CharacterModelPartCategory.Torso]: "humanoid/midieval/midieval-torso.glb",
    // [CharacterModelPartCategory.Legs]: "humanoid/midieval/midieval-legs.glb",
  },
  [CombatantClass.Mage]: {
    [CharacterModelPartCategory.Head]: "humanoid/adventurer/adventurer-head.glb",
    [CharacterModelPartCategory.Torso]: "humanoid/adventurer/adventurer-torso.glb",
    [CharacterModelPartCategory.Legs]: "humanoid/adventurer/adventurer-legs.glb",
    // [CharacterModelPartCategory.Head]: "humanoid/witch/witch-head.glb",
    // [CharacterModelPartCategory.Torso]: "humanoid/witch/witch-torso.glb",
    // [CharacterModelPartCategory.Legs]: "humanoid/witch/witch-legs.glb",
  },
};

export const MONSTER_FULL_SKINS: Partial<Record<MonsterType, string>> = {
  [MonsterType.MetallicGolem]: "monsters/wolf-full.glb",
  [MonsterType.Wolf]: "monsters/wolf-full.glb",
  [MonsterType.Zombie]: "monsters/skeleton-full.glb",
  [MonsterType.SkeletonArcher]: "monsters/skeleton-full.glb",
  [MonsterType.Scavenger]: "monsters/velociraptor-full.glb",
  [MonsterType.Vulture]: "monsters/dragon-full.glb",
  // [MonsterType.FireMage]: "monsters/",
  // [MonsterType.Cultist]: "monsters/",
  [MonsterType.FireElemental]: "monsters/cube-full.glb",
  [MonsterType.IceElemental]: "monsters/cube-full.glb",
};
