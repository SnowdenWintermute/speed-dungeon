export enum OneHandedMeleeWeapon {
  // PHYSICAL BLUNT
  Stick,
  Club,
  Mace,
  Morningstar,
  WarHammer,
  // PHYSICAL SLASHING
  ButterKnife,
  ShortSword,
  Blade,
  BroadSword,
  BastardSword,
  // PHYSICAL PIERCING
  Dagger,
  Rapier,
  ShortSpear,
  // PHYSICAL ELEMENTAL
  RuneSword,
  // MAGICAL SLASHING
  EtherBlade,
  IceBlade,
  // FOR MAGES
  MapleWand,
  WillowWand,
  YewWand,
  RoseWand,
}

export const ONE_HANDED_MELEE_WEAPON_NAMES: Record<OneHandedMeleeWeapon, string> = {
  [OneHandedMeleeWeapon.Stick]: "Stick",
  [OneHandedMeleeWeapon.Club]: "Club",
  [OneHandedMeleeWeapon.Mace]: "Mace",
  [OneHandedMeleeWeapon.Morningstar]: "Morningstar",
  [OneHandedMeleeWeapon.WarHammer]: "War Hammer",
  [OneHandedMeleeWeapon.ButterKnife]: "Butter Knife",
  [OneHandedMeleeWeapon.ShortSword]: "Short Sword",
  [OneHandedMeleeWeapon.Blade]: "Blade",
  [OneHandedMeleeWeapon.BroadSword]: "Broad Sword",
  [OneHandedMeleeWeapon.BastardSword]: "Bastard Sword",
  [OneHandedMeleeWeapon.Dagger]: "Dagger",
  [OneHandedMeleeWeapon.Rapier]: "Rapier",
  [OneHandedMeleeWeapon.ShortSpear]: "Short Spear",
  [OneHandedMeleeWeapon.RuneSword]: "Rune Sword",
  [OneHandedMeleeWeapon.EtherBlade]: "Ether Blade",
  [OneHandedMeleeWeapon.IceBlade]: "Ice Blade",
  [OneHandedMeleeWeapon.MapleWand]: "Maple Wand",
  [OneHandedMeleeWeapon.WillowWand]: "Willow Wand",
  [OneHandedMeleeWeapon.YewWand]: "Yew Wand",
  [OneHandedMeleeWeapon.RoseWand]: "Rose Wand",
};
