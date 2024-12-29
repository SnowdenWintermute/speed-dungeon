export enum KineticDamageType {
  Blunt,
  Slashing,
  Piercing,
}

export const KINETIC_DAMAGE_TYPE_STRINGS: Record<KineticDamageType, string> = {
  [KineticDamageType.Blunt]: "Blunt",
  [KineticDamageType.Slashing]: "Slashing",
  [KineticDamageType.Piercing]: "Piercing",
};
