import { AffixType, PrefixType } from "@speed-dungeon/common";

export function getPrefixName(prefixType: PrefixType, tier: number) {
  const nameOption = PREFIX_NAMES[prefixType][tier];
  if (nameOption === undefined) return "Hacked";
  return nameOption;
}

const PREFIX_NAMES: Record<PrefixType, Record<number, string>> = {
  [AffixType.Mp]: {
    [1]: "Bluejay's",
    [2]: "Cockatoo's",
    [3]: "Owl's",
    [4]: "Kea's",
    [5]: "Raven's",
  },
  [AffixType.FlatArmorClass]: {
    [1]: "Sturdy",
    [2]: "Strong",
    [3]: "Robust",
    [4]: "Reinforced",
    [5]: "Unyielding",
  },
  [AffixType.Accuracy]: {
    [1]: "Steady",
    [2]: "Stable",
    [3]: "Sighted",
    [4]: "Guided",
    [5]: "Precient",
  },
  [AffixType.PercentDamage]: {
    [1]: "Jagged",
    [2]: "Deadly",
    [3]: "Vicious",
    [4]: "Brutal",
    [5]: "Savage",
  },
  [AffixType.LifeSteal]: {
    [1]: "Mosquito's",
    [2]: "Tick's",
    [3]: "Leech's",
    [4]: "Bat's",
    [5]: "Lamprey's",
  },
  [AffixType.Evasion]: {
    [1]: "Monkey's",
    [2]: "Rabbit's",
    [3]: "Squirrel's",
    [4]: "Chipmonk's",
    [5]: "Field Mouse's",
  },
  [AffixType.ArmorPenetration]: {
    [1]: "Heavy",
    [2]: "Dense",
    [3]: "Solid",
    [4]: "Puncturing",
    [5]: "Penetrating",
  },
  [AffixType.Agility]: {
    [1]: "Maneuverable",
    [2]: "Lightweight",
    [3]: "Ultralight",
    [4]: "Featherlight",
    [5]: "Weightless",
  },
};
