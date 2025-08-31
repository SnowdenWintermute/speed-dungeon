import { AffixType, SuffixType } from "@speed-dungeon/common";

export function getSuffixName(suffixType: SuffixType, tier: number) {
  const nameOption = SUFFIX_NAMES[suffixType][tier];
  if (nameOption === undefined) return "Hacked";
  return nameOption;
}

const SUFFIX_NAMES: Record<SuffixType, Record<number, string>> = {
  [AffixType.Strength]: {
    [1]: "Strength",
    [2]: "Might",
    [3]: "Power",
    [4]: "Giants",
    [5]: "Titans",
  },
  [AffixType.Spirit]: {
    [1]: "Spirit",
    [2]: "the Mind",
    [3]: "Wisdom",
    [4]: "Attunement",
    [5]: "Enlightenment",
  },
  [AffixType.Dexterity]: {
    [1]: "Dexterity",
    [2]: "Proficiency",
    [3]: "Finesse",
    [4]: "Mastery",
    [5]: "Perfection",
  },
  [AffixType.Vitality]: {
    [1]: "of Vitality",
    [2]: "of Zest",
    [3]: "of Vim",
    [4]: "of Vigor",
    [5]: "of Life",
  },
  [AffixType.AllBase]: {
    [1]: "the Sky",
    [2]: "the Moon",
    [3]: "the Stars",
    [4]: "the Heavens",
    [5]: "the Zodiac",
  },
  [AffixType.Hp]: {
    [1]: "the Fox",
    [2]: "the Wolf",
    [3]: "the Lion",
    [4]: "the Bear",
    [5]: "the Whale",
  },
  [AffixType.FlatDamage]: {
    [1]: "Harm",
    [2]: "Ruin",
    [3]: "Destruction",
    [4]: "Devestation",
    [5]: "Annihilation",
  },
  [AffixType.Durability]: {
    [1]: "Sturdiness",
    [2]: "Structure",
    [3]: "the Ages",
    [4]: "the Eons",
    [5]: "Eternity",
  },
  [AffixType.PercentArmorClass]: {
    [1]: "Protection",
    [2]: "Absorbtion",
    [3]: "Osmosis",
    [4]: "Deflection",
    [5]: "Immortality",
  },
};
