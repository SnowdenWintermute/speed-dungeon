export enum TwoHandedMeleeWeapon {
  RottingBranch,
  BoStaff,
  Spear,
  Bardiche,
  SplittingMaul,
  Maul,
  BattleAxe,
  Glaive,
  ElementalStaff,
  Trident,
  GreatAxe,
  GravityHammer,
  // FOR MAGES
  ElmStaff,
  MahoganyStaff,
  EbonyStaff,
}

export function formatTwoHandedMeleeWeapon(weapon: TwoHandedMeleeWeapon): string {
  switch (weapon) {
    case TwoHandedMeleeWeapon.RottingBranch:
      return "Rotting Branch";
    case TwoHandedMeleeWeapon.BoStaff:
      return "Bo Staff";
    case TwoHandedMeleeWeapon.Spear:
      return "Spear";
    case TwoHandedMeleeWeapon.Bardiche:
      return "Bardiche";
    case TwoHandedMeleeWeapon.SplittingMaul:
      return "Splitting Maul";
    case TwoHandedMeleeWeapon.Maul:
      return "Maul";
    case TwoHandedMeleeWeapon.BattleAxe:
      return "Battle Axe";
    case TwoHandedMeleeWeapon.Glaive:
      return "Glaive";
    case TwoHandedMeleeWeapon.ElementalStaff:
      return "Elemental Staff";
    case TwoHandedMeleeWeapon.Trident:
      return "Trident";
    case TwoHandedMeleeWeapon.GreatAxe:
      return "Great Axe";
    case TwoHandedMeleeWeapon.GravityHammer:
      return "Gravity Hammer";
    case TwoHandedMeleeWeapon.ElmStaff:
      return "Elm Staff";
    case TwoHandedMeleeWeapon.MahoganyStaff:
      return "Mahogany Staff";
    case TwoHandedMeleeWeapon.EbonyStaff:
      return "Ebony Staff";
  }
}
