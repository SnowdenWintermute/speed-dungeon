import { CombatantClass, MonsterType } from "@speed-dungeon/common";

export enum CharacterModelPartCategory {
  Head,
  Torso,
  Legs,
  Full,
}

export interface CharacterModelPart {
  category: CharacterModelPartCategory;
  assetPath: string;
}

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

export const MONSTER_FULL_SKINS: Record<MonsterType, string> = {
  [MonsterType.Wolf]: "monsters/wolf-full.glb",
  [MonsterType.MantaRay]: "monsters/manta-ray-full.glb",
  [MonsterType.Spider]: "monsters/spider-full.glb",
  [MonsterType.Net]: "effects/net-full.glb",
  [MonsterType.Slime]: "monsters/slime-full.glb",
  [MonsterType.FireMage]: "",
  [MonsterType.Cultist]: "",
  [MonsterType.Zombie]: "monsters/zombie-full.glb",
  [MonsterType.SkeletonWarrior]: "monsters/skeleton-full.glb",
  [MonsterType.SkeletonCaptain]: "monsters/skeleton-captain-full.glb",
  [MonsterType.VampireBat]: "monsters/bat-full.glb",
};
