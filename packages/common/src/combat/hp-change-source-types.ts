import { MagicalElement } from "./magical-elements";

export class HpChangeSource {
  constructor(
    public category: HpChangeSourceCategory = {
      type: HpChangeSourceCategoryType.Direct,
    },
    public physicalDamageTypeOption: null | PhysicalDamageType = null,
    public elementOption: null | MagicalElement = null
  ) {}
}

export enum PhysicalDamageType {
  Blunt,
  Slashing,
  Piercing,
}

export enum HpChangeSourceCategoryType {
  PhysicalDamage,
  MagicalDamage,
  Healing,
  Direct,
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

export type HpChangeSourceCategory = PhysicalDamage | MagicalDamage | Healing | Direct;

export enum MeleeOrRanged {
  Melee,
  Ranged,
}

export enum Evadable {
  False,
  True,
}
