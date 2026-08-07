/** How hard a monster leans on one attribute, on a one to five scale shared by every attribute we
 * tune — evasion first, then armor class, basic attack damage and the rest. A monster picks an
 * intensity per attribute, so a slow bruiser can be VeryHigh armor class and VeryLow evasion. */
export enum MonsterAttributeIntensity {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5,
}

export const MONSTER_ATTRIBUTE_INTENSITIES = [
  MonsterAttributeIntensity.VeryLow,
  MonsterAttributeIntensity.Low,
  MonsterAttributeIntensity.Medium,
  MonsterAttributeIntensity.High,
  MonsterAttributeIntensity.VeryHigh,
];

export const MONSTER_ATTRIBUTE_INTENSITY_NAMES: Record<MonsterAttributeIntensity, string> = {
  [MonsterAttributeIntensity.VeryLow]: "Very Low",
  [MonsterAttributeIntensity.Low]: "Low",
  [MonsterAttributeIntensity.Medium]: "Medium",
  [MonsterAttributeIntensity.High]: "High",
  [MonsterAttributeIntensity.VeryHigh]: "Very High",
};

/** Each intensity is defined by the *character* it is calibrated against, not by the monster. An
 * attribute at a given intensity is set so this character reaches the target outcome against it —
 * so "Medium" means "the player who put a sixth of what they had into this answers it comfortably".
 *
 * Both fields describe that character. They are stated as a share of what a player could commit
 * rather than as raw numbers, so the same profile works for any attribute: for evasion the
 * committed resource is accuracy, for armor class it would be damage. */
export interface ReferenceCharacterProfile {
  /** Whether this character took a support class, at the highest level their main class allows. */
  characterHasSupportClass: boolean;
  /** How much of the character's discretionary resources went into countering this attribute:
   * attribute points from levels and support levels, plus what their gear could offer. Inherent
   * class values are always counted in full and are not part of this share. */
  characterAllocatedFraction: number;
}

/** VeryLow is the only profile without a support class: it is the floor of "a player who is not
 * trying", so it should be answerable by someone who never read a skill book either. */
export const REFERENCE_CHARACTER_PROFILES: Record<
  MonsterAttributeIntensity,
  ReferenceCharacterProfile
> = {
  [MonsterAttributeIntensity.VeryLow]: {
    characterHasSupportClass: false,
    characterAllocatedFraction: 0,
  },
  [MonsterAttributeIntensity.Low]: {
    characterHasSupportClass: true,
    characterAllocatedFraction: 0,
  },
  [MonsterAttributeIntensity.Medium]: {
    characterHasSupportClass: true,
    characterAllocatedFraction: 1 / 6,
  },
  [MonsterAttributeIntensity.High]: {
    characterHasSupportClass: true,
    characterAllocatedFraction: 1 / 4,
  },
  [MonsterAttributeIntensity.VeryHigh]: {
    characterHasSupportClass: true,
    characterAllocatedFraction: 3 / 5,
  },
};
