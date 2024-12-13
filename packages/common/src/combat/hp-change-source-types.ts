import { KineticDamageType } from "./kinetic-damage-types.js";
import { MagicalElement } from "./magical-elements.js";

// used to designate what properties of a weapon
// should be applied to an ability
export enum HpChangeSourceModifiers {
  KineticType,
  MagicalElement,
  SourceCategory,
  Lifesteal,
}

export class HpChangeSource {
  constructor(
    public category: HpChangeSourceCategory,
    public meleeOrRanged: MeleeOrRanged,
    public kineticDamageTypeOption?: KineticDamageType,
    public elementOption?: MagicalElement,
    public unavoidable?: boolean,
    public isHealing?: boolean,
    public lifestealPercentage?: number
  ) {}
}

export enum HpChangeSourceCategory {
  Physical,
  Magical,
  Medical,
  Direct,
}

export enum MeleeOrRanged {
  Melee,
  Ranged,
}

export const HP_CHANGE_SOURCE_CATEGORY_STRINGS: Record<HpChangeSourceCategory, string> = {
  [HpChangeSourceCategory.Physical]: "Physical",
  [HpChangeSourceCategory.Magical]: "Magical",
  [HpChangeSourceCategory.Medical]: "Medical",
  [HpChangeSourceCategory.Direct]: "Direct",
};

export class HpChange {
  constructor(
    public value: number,
    public source: HpChangeSource,
    public isCrit?: boolean
  ) {}
}
