import { CombatantClass, MonsterType } from "@speed-dungeon/common";
import { Artist } from "../../artists";

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

// a null artist means the model is not yet attributed, and no attribution will be shown for it
export interface CombatantModel {
  path: string;
  artist: Artist | null;
}

export const CHARACTER_PARTS: Record<
  CombatantClass,
  Partial<Record<CharacterModelPartCategory, CombatantModel>>
> = {
  [CombatantClass.Warrior]: {
    [CharacterModelPartCategory.Head]: {
      path: "humanoid/adventurer/adventurer-head.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Torso]: {
      path: "humanoid/adventurer/adventurer-torso.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Legs]: {
      path: "humanoid/adventurer/adventurer-legs.glb",
      artist: Artist.Quaternius,
    },
  },
  [CombatantClass.Rogue]: {
    [CharacterModelPartCategory.Head]: {
      path: "humanoid/adventurer/adventurer-head.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Torso]: {
      path: "humanoid/adventurer/adventurer-torso.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Legs]: {
      path: "humanoid/adventurer/adventurer-legs.glb",
      artist: Artist.Quaternius,
    },
  },
  [CombatantClass.Mage]: {
    [CharacterModelPartCategory.Head]: {
      path: "humanoid/adventurer/adventurer-head.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Torso]: {
      path: "humanoid/adventurer/adventurer-torso.glb",
      artist: Artist.Quaternius,
    },
    [CharacterModelPartCategory.Legs]: {
      path: "humanoid/adventurer/adventurer-legs.glb",
      artist: Artist.Quaternius,
    },
  },
};

// a null entry means the monster has no full skin and is instead built from CHARACTER_PARTS
export const MONSTER_FULL_SKINS: Record<MonsterType, CombatantModel | null> = {
  [MonsterType.Wolf]: { path: "monsters/wolf-full.glb", artist: Artist.Quaternius },
  [MonsterType.MantaRay]: { path: "monsters/manta-ray-full.glb", artist: Artist.Quaternius },
  [MonsterType.Spider]: { path: "monsters/spider-full.glb", artist: Artist.GuieA_7 },
  [MonsterType.Net]: { path: "effects/net-full.glb", artist: Artist.Snowden },
  [MonsterType.Slime]: { path: "monsters/slime-full.glb", artist: Artist.Quaternius },
  [MonsterType.FireMage]: null,
  [MonsterType.Cultist]: null,
  [MonsterType.Zombie]: { path: "monsters/zombie-full.glb", artist: Artist.ClintBellanger },
  [MonsterType.SkeletonWarrior]: {
    path: "monsters/skeleton-full.glb",
    artist: Artist.ClintBellanger,
  },
  [MonsterType.SkeletonCaptain]: {
    path: "monsters/skeleton-captain-full.glb",
    artist: Artist.ClintBellanger,
  },
  [MonsterType.VampireBat]: { path: "monsters/bat-full.glb", artist: Artist.Zsky },
  [MonsterType.TyrantRex]: { path: "monsters/t-rex-full.glb", artist: Artist.Quaternius },
};
