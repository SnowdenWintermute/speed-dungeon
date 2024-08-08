import { CombatantClass } from "@speed-dungeon/common";

export enum ModularCharacterPart {
  Head,
  Torso,
  Legs,
}

export enum CombatantSpecies {
  Humanoid,
}

export const BASE_FILE_PATH = "./3d-assets/";

export const SKELETONS: Record<CombatantSpecies, string> = {
  [CombatantSpecies.Humanoid]: "humanoid-skeleton.glb",
};

export const CHARACTER_PARTS: Record<CombatantClass, Record<ModularCharacterPart, string>> = {
  [CombatantClass.Warrior]: {
    [ModularCharacterPart.Head]: "adventurer-head.glb",
    [ModularCharacterPart.Torso]: "adventurer-torso.glb",
    [ModularCharacterPart.Legs]: "adventurer-legs.glb",
  },
  [CombatantClass.Rogue]: {
    [ModularCharacterPart.Head]: "midieval-head.glb",
    [ModularCharacterPart.Torso]: "midieval-torso.glb",
    [ModularCharacterPart.Legs]: "midieval-legs.glb",
  },
  [CombatantClass.Mage]: {
    [ModularCharacterPart.Head]: "witch-head.glb",
    [ModularCharacterPart.Torso]: "witch-torso.glb",
    [ModularCharacterPart.Legs]: "witch-legs.glb",
  },
};
