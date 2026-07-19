import { NormalizedPercentage } from "../../aliases.js";
import { ConsumableType } from "../consumables/consumable-types.js";
import { GuaranteedAffixes } from "../equipment/affixes.js";
import { EquipmentType } from "../equipment/equipment-types/index.js";

export enum LootItemLevelType {
  FloorBase,
  CenteredOnFloor,
  FloorPlusOffset,
}

export type LootItemLevel =
  | { type: LootItemLevelType.FloorBase }
  | { type: LootItemLevelType.CenteredOnFloor; spread: number }
  | { type: LootItemLevelType.FloorPlusOffset; offset: number };

export enum LootItemSelectorType {
  Any,
  Equipment,
  Consumable,
}

export type LootItemSelector =
  | {
      type: LootItemSelectorType.Any;
      categoryWeights: { equipment: number; consumable: number };
      equipmentTypeWeights?: Partial<Record<EquipmentType, number>>;
      consumableTypeWeights?: Partial<Record<ConsumableType, number>>;
    }
  | {
      type: LootItemSelectorType.Equipment;
      equipmentTypeWeights?: Partial<Record<EquipmentType, number>>;
      guaranteedAffixes?: GuaranteedAffixes;
    }
  | {
      type: LootItemSelectorType.Consumable;
      consumableTypeWeights?: Partial<Record<ConsumableType, number>>;
    };

export interface LootDropRule {
  chance: NormalizedPercentage;
  quantity: { min: number; max: number };
  itemLevel: LootItemLevel;
  selector: LootItemSelector;
}

export interface MonsterRewardProfile {
  experience: number;
  drops: LootDropRule[];
}
