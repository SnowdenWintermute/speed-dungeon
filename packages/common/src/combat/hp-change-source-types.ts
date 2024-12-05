import { KineticDamageType } from "./kinetic-damage-types.js";
import { MagicalElement } from "./magical-elements.js";

export class HpChangeSource {
  constructor(
    public category: HpChangeSourceCategory,
    public meleeOrRanged: MeleeOrRanged,
    public unavoidable?: boolean,
    public kineticDamageTypeOption?: KineticDamageType,
    public elementOption?: MagicalElement,
    public isHealing?: boolean
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
