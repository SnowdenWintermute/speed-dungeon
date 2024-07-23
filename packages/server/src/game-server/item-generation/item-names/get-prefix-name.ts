import { PrefixType } from "@speed-dungeon/common";

export function getPrefixName(prefixType: PrefixType, tier: number) {
  switch (prefixType) {
    case PrefixType.Mp:
      switch (tier) {
        case 1:
          return "Bluejay's";
        case 2:
          return "Cockatoo's";
        case 3:
          return "Owl's";
        case 4:
          return "Kea's";
        case 5:
          return "Raven's";
        default:
          return "hacked";
      }
    case PrefixType.ArmorClass:
      switch (tier) {
        case 1:
          return "Sturdy";
        case 2:
          return "Strong";
        case 3:
          return "Robust";
        case 4:
          return "Reinforced";
        case 5:
          return "Unyielding";
        default:
          return "hacked";
      }
    case PrefixType.Accuracy:
      switch (tier) {
        case 1:
          return "Steady";
        case 2:
          return "Stable";
        case 3:
          return "Sighted";
        case 4:
          return "Guided";
        case 5:
          return "Precient";
        default:
          return "hacked";
      }
    case PrefixType.PercentDamage: {
      switch (tier) {
        case 1:
          return "Jagged";
        case 2:
          return "Deadly";
        case 3:
          return "Vicious";
        case 4:
          return "Brutal";
        case 5:
          return "Savage";
        default:
          return "hacked";
      }
    }
    case PrefixType.LifeSteal: {
      switch (tier) {
        case 1:
          return "Mosquito's";
        case 2:
          return "Tick's";
        case 3:
          return "Leech's";
        case 4:
          return "Bat's";
        case 5:
          return "Lamprey's";
        default:
          return "hacked";
      }
    }
    case PrefixType.Resilience: {
      switch (tier) {
        case 1:
          return "Spirited";
        case 2:
          return "Hardy";
        case 3:
          return "Tenacious";
        case 4:
          return "Stalwart";
        case 5:
          return "Resolute";
        default:
          return "hacked";
      }
    }
    case PrefixType.Evasion: {
      switch (tier) {
        case 1:
          return "Monkey's";
        case 2:
          return "Rabbit's";
        case 3:
          return "Squirrel's";
        case 4:
          return "Chipmonk's";
        case 5:
          return "Field Mouse's";
        default:
          return "hacked";
      }
    }
    case PrefixType.ArmorPenetration: {
      switch (tier) {
        case 1:
          return "Heavy";
        case 2:
          return "Dense";
        case 3:
          return "Solid";
        case 4:
          return "Puncturing";
        case 5:
          return "Penetrating";
        default:
          return "hacked";
      }
    }
    case PrefixType.Agility: {
      switch (tier) {
        case 1:
          return "Maneuverable";
        case 2:
          return "Lightweight";
        case 3:
          return "Ultralight";
        case 4:
          return "Featherlight";
        case 5:
          return "Weightless";
        default:
          return "hacked";
      }
    }
    case PrefixType.Focus: {
      switch (tier) {
        case 1:
          return "Observant";
        case 2:
          return "Attentive";
        case 3:
          return "Intent";
        case 4:
          return "Concentrated";
        case 5:
          return "Singular";
        default:
          return "hacked";
      }
    }
  }
}
