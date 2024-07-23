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

export function formatTwoHandedRangedWeapon(weapon: TwoHandedRangedWeapon): string {
  switch (weapon) {
    case TwoHandedRangedWeapon.ShortBow:
      return "Short Bow";
    case TwoHandedRangedWeapon.RecurveBow:
      return "Recurve Bow";
    case TwoHandedRangedWeapon.CompositeBow:
      return "Composite Bow";
    case TwoHandedRangedWeapon.MilitaryBow:
      return "Military Bow";
    case TwoHandedRangedWeapon.EtherBow:
      return "Ether Bow";
  }
}
