import { Combatant } from "../../combatants/index.js";
import { EntityId } from "../../primatives/index.js";

export function calculateActionDurabiliyChanges(
  actionUser: Combatant,
  targetId: EntityId[]
): { [itemId: EntityId]: number } | undefined {
  return;
}
