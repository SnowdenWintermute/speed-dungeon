export enum OneHandedMeleeWeapon {
  // PHYSICAL BLUNT
  Stick,
  Mace,
  Morningstar,
  WarHammer,
  // PHYSICAL SLASHING
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

export function formatOneHandedMeleeWeapon(weapon: OneHandedMeleeWeapon) {
  switch (weapon) {
    case OneHandedMeleeWeapon.Stick:
      return "Stick";
    case OneHandedMeleeWeapon.Mace:
      return "Mace";
    case OneHandedMeleeWeapon.Morningstar:
      return "Morningstar";
    case OneHandedMeleeWeapon.WarHammer:
      return "War Hammer";
    case OneHandedMeleeWeapon.ShortSword:
      return "Short Sword";
    case OneHandedMeleeWeapon.Blade:
      return "Blade";
    case OneHandedMeleeWeapon.BroadSword:
      return "Broad Sword";
    case OneHandedMeleeWeapon.BastardSword:
      return "Bastard Sword";
    case OneHandedMeleeWeapon.Dagger:
      return "Dagger";
    case OneHandedMeleeWeapon.Rapier:
      return "Rapier";
    case OneHandedMeleeWeapon.ShortSpear:
      return "Short Spear";
    case OneHandedMeleeWeapon.RuneSword:
      return "Rune Sword";
    case OneHandedMeleeWeapon.EtherBlade:
      return "Ether Blade";
    case OneHandedMeleeWeapon.IceBlade:
      return "Ice Blade";
    case OneHandedMeleeWeapon.MapleWand:
      return "Maple Wand";
    case OneHandedMeleeWeapon.WillowWand:
      return "Willow Wand";
    case OneHandedMeleeWeapon.YewWand:
      return "Yew Wand";
    case OneHandedMeleeWeapon.RoseWand:
      return "Rose Wand";
  }
}
