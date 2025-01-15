import { Combatant } from "../../combatants/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { EntityId } from "../../primatives/index.js";

export interface DurabilityChanges {
  [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, number>>;
  [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, number>>;
}

export function calculateActionDurabiliyChanges(
  actionUser: Combatant,
  targetId: EntityId[]
): { [itemId: EntityId]: number } | undefined {
  // determine if ability should cause weapon durability loss on hit
  //
  return;
}
