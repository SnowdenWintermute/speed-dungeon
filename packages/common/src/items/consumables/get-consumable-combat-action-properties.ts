import { ConsumableProperties, ConsumableType } from "./index.js";
import { TargetCategories } from "../../combat/index.js";
import {
  CombatActionProperties,
  ActionUsableContext,
} from "../../combat/combat-actions/combat-action-properties.js";

export default function getConsumableCombatActionProperties(
  consumableProperties: ConsumableProperties
) {
  const cap = new CombatActionProperties();
  switch (consumableProperties.consumableType) {
    case ConsumableType.HpAutoinjector:
      cap.validTargetCategories = TargetCategories.Friendly;
      cap.usabilityContext = ActionUsableContext.All;
      cap.requiresCombatTurn = false;
      cap.description = "Heal a friendly target";
      break;
    case ConsumableType.MpAutoinjector:
      cap.validTargetCategories = TargetCategories.Friendly;
      cap.usabilityContext = ActionUsableContext.All;
      cap.requiresCombatTurn = false;
      cap.description = "Restore MP to a friendly target";
      break;
  }

  return cap;
}
