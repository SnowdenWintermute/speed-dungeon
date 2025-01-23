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

export interface HpChangeSourceConfig {
  category: HpChangeSourceCategory;
  kineticDamageTypeOption: null | KineticDamageType;
  elementOption: null | MagicalElement;
  isHealing: null | boolean;
  lifestealPercentage: null | number;
}

// for sending over the wire
export class HpChangeSource {
  category: HpChangeSourceCategory;
  kineticDamageTypeOption?: KineticDamageType;
  elementOption?: MagicalElement;
  isHealing?: boolean;
  lifestealPercentage?: number;
  constructor(config: HpChangeSourceConfig) {
    this.category = config.category;
    config.kineticDamageTypeOption !== null && this.kineticDamageTypeOption;
    config.elementOption !== null && this.elementOption;
    config.isHealing !== null && this.isHealing;
    config.lifestealPercentage !== null && this.lifestealPercentage;
  }
}

export enum HpChangeSourceCategory {
  Physical,
  Magical,
  Medical,
  Direct,
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
