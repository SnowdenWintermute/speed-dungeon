import { ConsumableProperties, ConsumableType } from ".";
import { TargetCategories } from "../../combat";
import {
  CombatActionProperties,
  ActionUsableContext,
} from "../../combat/combat-actions/combat-action-properties";

export default function getConsumableCombatActionProperties(this: ConsumableProperties) {
  const cap = new CombatActionProperties();
  switch (this.consumableType) {
    case ConsumableType.HpAutoinjector:
      cap.validTargetCategories = TargetCategories.Friendly;
      cap.usabilityContext = ActionUsableContext.All;
      cap.requiresCombatTurn = false;
      cap.description = "Heal a friendly target";
    case ConsumableType.MpAutoinjector:
      cap.validTargetCategories = TargetCategories.Friendly;
      cap.usabilityContext = ActionUsableContext.All;
      cap.requiresCombatTurn = false;
      cap.description = "Restore MP to a friendly target";
  }

  return cap;
}
