export enum TwoHandedRangedWeapon {
  // PHYSICAL BLUNT
  // PHYSICAL SLASHING
  // PHYSICAL PIERCING
  ShortBow,
  RecurveBow,
  CompositeBow,
  MilitaryBow,
  // PHYSICAL ELEMENTAL
  // MAGICAL SLASHING
  // MAGICAL PIERCING
  EtherBow,
}

export const TWO_HANDED_RANGED_WEAPON_TYPE_STRINGS: Record<TwoHandedRangedWeapon, string> = {
  [TwoHandedRangedWeapon.ShortBow]: "Short Bow",
  [TwoHandedRangedWeapon.RecurveBow]: "Recurve Bow",
  [TwoHandedRangedWeapon.CompositeBow]: "Composite Bow",
  [TwoHandedRangedWeapon.MilitaryBow]: "Military Bow",
  [TwoHandedRangedWeapon.EtherBow]: "Ether Bow",
};
