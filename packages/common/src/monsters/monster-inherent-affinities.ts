import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { MonsterType } from "./monster-types.js";

const UNDEAD_ELEMENTAL_AFFINITIES = {
  [MagicalElement.Light]: -25,
  [MagicalElement.Fire]: -25,
};

export const MONSTER_INHERENT_ELEMENTAL_AFFINITIES: Record<
  MonsterType,
  Partial<Record<MagicalElement, number>>
> = {
  [MonsterType.Wolf]: {},
  [MonsterType.FireMage]: {},
  [MonsterType.Cultist]: {},
  [MonsterType.MantaRay]: {
    [MagicalElement.Fire]: -25,
  },
  [MonsterType.Net]: {},
  [MonsterType.Spider]: {
    [MagicalElement.Fire]: -25,
  },
  [MonsterType.Slime]: {
    [MagicalElement.Fire]: 50,
    [MagicalElement.Ice]: -25,
  },
  [MonsterType.Zombie]: UNDEAD_ELEMENTAL_AFFINITIES,
  [MonsterType.SkeletonWarrior]: UNDEAD_ELEMENTAL_AFFINITIES,
  [MonsterType.SkeletonCaptain]: UNDEAD_ELEMENTAL_AFFINITIES,
  [MonsterType.VampireBat]: {
    [MagicalElement.Wind]: -50,
    [MagicalElement.Earth]: 50,
    [MagicalElement.Lightning]: -25,
  },
  [MonsterType.TyrantRex]: {
    [MagicalElement.Ice]: -150,
    [MagicalElement.Dark]: 50,
  },
};

const UNDEAD_KINETIC_AFFINITIES = {
  [KineticDamageType.Blunt]: -25,
  [KineticDamageType.Piercing]: 25,
  [KineticDamageType.Slashing]: 25,
};

export const MONSTER_INHERENT_KINETIC_AFFINITIES: Record<
  MonsterType,
  Partial<Record<KineticDamageType, number>>
> = {
  [MonsterType.Wolf]: {
    [KineticDamageType.Blunt]: 25,
    [KineticDamageType.Piercing]: 0,
    [KineticDamageType.Slashing]: -25,
  },
  [MonsterType.FireMage]: {},
  [MonsterType.Cultist]: {},
  [MonsterType.MantaRay]: {
    [KineticDamageType.Piercing]: -25,
  },
  [MonsterType.Net]: {},
  [MonsterType.Spider]: {},
  [MonsterType.Slime]: {
    [KineticDamageType.Blunt]: 75,
    [KineticDamageType.Piercing]: 75,
    [KineticDamageType.Slashing]: 75,
  },
  [MonsterType.Zombie]: UNDEAD_KINETIC_AFFINITIES,
  [MonsterType.SkeletonWarrior]: UNDEAD_KINETIC_AFFINITIES,
  [MonsterType.SkeletonCaptain]: UNDEAD_KINETIC_AFFINITIES,
  [MonsterType.VampireBat]: {
    [KineticDamageType.Piercing]: -25,
  },
  [MonsterType.TyrantRex]: {
    [KineticDamageType.Piercing]: -25,
    [KineticDamageType.Slashing]: -25,
  },
};
