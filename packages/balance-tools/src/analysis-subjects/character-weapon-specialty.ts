export enum CharacterWeaponSpecialty {
  TwoHandedMelee,
  TwoHandedRanged,
  DualWield,
  Shields,
}

export const CHARACTER_WEAPON_SPECIALTY_STRINGS: Record<CharacterWeaponSpecialty, string> = {
  [CharacterWeaponSpecialty.TwoHandedMelee]: "Two Handed Melee",
  [CharacterWeaponSpecialty.TwoHandedRanged]: "Two Handed Ranged",
  [CharacterWeaponSpecialty.DualWield]: "Dual Wield",
  [CharacterWeaponSpecialty.Shields]: "Shield",
};
