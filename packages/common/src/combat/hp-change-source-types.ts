import { MagicalElement } from "./magical-elements.js";

export class HpChangeSource {
  constructor(
    public category: HpChangeSourceCategory = {
      type: HpChangeSourceCategoryType.Direct,
    },
    public physicalDamageTypeOption?: PhysicalDamageType,
    public elementOption?: MagicalElement
  ) {}
}

export enum PhysicalDamageType {
  Blunt,
  Slashing,
  Piercing,
}

export function formatPhysicalDamageType(physicalDamageType: PhysicalDamageType) {
  switch (physicalDamageType) {
    case PhysicalDamageType.Blunt:
      return "Blunt";
    case PhysicalDamageType.Slashing:
      return "Slashing";
    case PhysicalDamageType.Piercing:
      return "Piercing";
  }
}

export enum HpChangeSourceCategoryType {
  PhysicalDamage,
  MagicalDamage,
  Healing,
  Direct,
  Medical,
}

export interface PhysicalDamage {
  type: HpChangeSourceCategoryType.PhysicalDamage;
  meleeOrRanged: MeleeOrRanged;
}

export interface MagicalDamage {
  type: HpChangeSourceCategoryType.MagicalDamage;
  evadable: Evadable;
}

export interface Healing {
  type: HpChangeSourceCategoryType.Healing;
}

export interface Direct {
  type: HpChangeSourceCategoryType.Direct;
}

export interface Medical {
  type: HpChangeSourceCategoryType.Medical;
}

export type HpChangeSourceCategory = PhysicalDamage | MagicalDamage | Healing | Direct | Medical;

export enum MeleeOrRanged {
  Melee,
  Ranged,
}

export enum Evadable {
  False,
  True,
}

export function formatHpChangeSourceCategory(sourceCategory: HpChangeSourceCategory): string {
  switch (sourceCategory.type) {
    case HpChangeSourceCategoryType.PhysicalDamage:
      switch (sourceCategory.meleeOrRanged) {
        case MeleeOrRanged.Melee:
          return "Melee";
        case MeleeOrRanged.Ranged:
          return "Ranged";
      }
    case HpChangeSourceCategoryType.MagicalDamage:
      switch (sourceCategory.evadable) {
        case Evadable.False:
          return "Magical";
        case Evadable.True:
          return "Magical (Evadable)";
      }
    case HpChangeSourceCategoryType.Healing:
      return "Healing";
    case HpChangeSourceCategoryType.Direct:
      return "Direct";
    case HpChangeSourceCategoryType.Medical:
      return "Medical";
  }
}
