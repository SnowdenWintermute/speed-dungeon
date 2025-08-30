import { SuffixType } from "@speed-dungeon/common";

export function getSuffixName(suffixType: SuffixType, tier: number) {
  switch (suffixType) {
    case SuffixType.Strength:
      switch (tier) {
        case 1:
          return "Strength";
        case 2:
          return "Might";
        case 3:
          return "Power";
        case 4:
          return "Giants";
        case 5:
          return "Titans";
        default:
          return "hacked";
      }
    case SuffixType.Spirit:
      switch (tier) {
        case 1:
          return "Spirit";
        case 2:
          return "the Mind";
        case 3:
          return "Wisdom";
        case 4:
          return "Attunement";
        case 5:
          return "Enlightenment";
        default:
          return "hacked";
      }
    case SuffixType.Dexterity:
      switch (tier) {
        case 1:
          return "Dexterity";
        case 2:
          return "Proficiency";
        case 3:
          return "Finesse";
        case 4:
          return "Mastery";
        case 5:
          return "Perfection";
        default:
          return "hacked";
      }
    case SuffixType.Vitality:
      switch (tier) {
        case 1:
          return "of Vitality";
        case 2:
          return "of Zest";
        case 3:
          return "of Vim";
        case 4:
          return "of Vigor";
        case 5:
          return "of Life";
        default:
          return "hacked";
      }
    case SuffixType.AllBase:
      switch (tier) {
        case 1:
          return "the Sky";
        case 2:
          return "the Moon";
        case 3:
          return "the Stars";
        case 4:
          return "the Heavens";
        case 5:
          return "the Zodiac";
        default:
          return "hacked";
      }
    case SuffixType.Hp:
      switch (tier) {
        case 1:
          return "the Fox";
        case 2:
          return "the Wolf";
        case 3:
          return "the Lion";
        case 4:
          return "the Bear";
        case 5:
          return "the Whale";
        default:
          return "hacked";
      }
    case SuffixType.Damage:
      switch (tier) {
        case 1:
          return "Harm";
        case 2:
          return "Ruin";
        case 3:
          return "Destruction";
        case 4:
          return "Devestation";
        case 5:
          return "Annihilation";
        default:
          return "hacked";
      }
    case SuffixType.Durability:
      switch (tier) {
        case 1:
          return "Sturdiness";
        case 2:
          return "Structure";
        case 3:
          return "the Ages";
        case 4:
          return "the Eons";
        case 5:
          return "Eternity";
        default:
          "hacked";
      }
    case SuffixType.PercentArmorClass:
      switch (tier) {
        case 1:
          return "Protection";
        case 2:
          return "Absorbtion";
        case 3:
          return "Osmosis";
        case 4:
          return "Deflection";
        case 5:
          return "Immortality";
        default:
          "hacked";
      }
  }
}
