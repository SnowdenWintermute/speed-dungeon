import { Consumable, ConsumableType } from "./index.js";
import { TargetCategories } from "../../combat/combat-actions/targeting-schemes-and-categories.js";

export function getConsumableCombatActionProperties(consumable: Consumable) {
  // const cap = new CombatActionProperties();
  // switch (consumable.consumableType) {
  //   case ConsumableType.HpAutoinjector:
  //     cap.validTargetCategories = TargetCategories.Friendly;
  //     cap.usabilityContext = ActionUsableContext.All;
  //     cap.requiresCombatTurn = false;
  //     cap.description = "Heal a friendly target";
  //     break;
  //   case ConsumableType.MpAutoinjector:
  //     cap.validTargetCategories = TargetCategories.Friendly;
  //     cap.usabilityContext = ActionUsableContext.All;
  //     cap.requiresCombatTurn = false;
  //     cap.description = "Restore MP to a friendly target";
  //     break;
  //   case ConsumableType.StackOfShards:
  //     cap.validTargetCategories = TargetCategories.User;
  //     cap.usabilityContext = ActionUsableContext.All;
  //     cap.requiresCombatTurn = false;
  //     cap.description = "Could be useful...";
  //     break;
  // }
  // return cap;
}
