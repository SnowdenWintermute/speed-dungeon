import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_INHERENT_ELEMENTAL_AFFINITIES: Record<
  MonsterType,
  Partial<Record<MagicalElement, number>>
> = {
  [MonsterType.Wolf]: {},
  [MonsterType.FireMage]: {},
  [MonsterType.Cultist]: {},
  [MonsterType.MantaRay]: {},
  [MonsterType.Net]: {},
  [MonsterType.Spider]: {},
  [MonsterType.Slime]: {
    [MagicalElement.Fire]: 50,
  },
  [MonsterType.Zombie]: { [MagicalElement.Light]: -50, [MagicalElement.Fire]: -25 },
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
  [MonsterType.MantaRay]: {},
  [MonsterType.Net]: {},
  [MonsterType.Spider]: {},
  [MonsterType.Slime]: {
    [KineticDamageType.Blunt]: 75,
    [KineticDamageType.Piercing]: 75,
    [KineticDamageType.Slashing]: 75,
  },
  [MonsterType.Zombie]: {
    [KineticDamageType.Blunt]: -50,
    [KineticDamageType.Piercing]: 50,
    [KineticDamageType.Slashing]: 50,
  },
};
