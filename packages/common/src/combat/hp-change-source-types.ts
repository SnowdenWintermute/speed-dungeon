import { ActionPayableResource } from "./combat-actions/index.js";
import { KineticDamageType } from "./kinetic-damage-types.js";
import { MagicalElement } from "./magical-elements.js";

// used to designate what properties of a weapon
// should be applied to an ability
export enum ResourceChangeSourceModifiers {
  KineticType,
  MagicalElement,
  SourceCategory,
  Lifesteal,
}

export interface ResourceChangeSourceConfig {
  category: ResourceChangeSourceCategory;
  kineticDamageTypeOption?: null | KineticDamageType;
  elementOption?: null | MagicalElement;
  isHealing?: null | boolean;
  lifestealPercentage?: null | number;
}

// for sending over the wire
export class ResourceChangeSource {
  category: ResourceChangeSourceCategory;
  kineticDamageTypeOption?: KineticDamageType;
  elementOption?: MagicalElement;
  isHealing?: boolean;
  lifestealPercentage?: number;
  constructor(config: ResourceChangeSourceConfig) {
    this.category = config.category;
    if (config.kineticDamageTypeOption !== null)
      this.kineticDamageTypeOption = config.kineticDamageTypeOption;
    if (config.elementOption !== null) this.elementOption = config.elementOption;
    if (config.isHealing !== null) this.isHealing = config.isHealing;
    if (config.lifestealPercentage !== null) this.lifestealPercentage = config.lifestealPercentage;
  }
}

export enum ResourceChangeSourceCategory {
  Physical,
  Magical,
  Medical,
  Direct,
}

export const HP_CHANGE_SOURCE_CATEGORY_STRINGS: Record<ResourceChangeSourceCategory, string> = {
  [ResourceChangeSourceCategory.Physical]: "Physical",
  [ResourceChangeSourceCategory.Magical]: "Magical",
  [ResourceChangeSourceCategory.Medical]: "Medical",
  [ResourceChangeSourceCategory.Direct]: "Direct",
};

export class ResourceChange {
  constructor(
    public value: number,
    public source: ResourceChangeSource,
    public isCrit?: boolean
  ) {}
}
