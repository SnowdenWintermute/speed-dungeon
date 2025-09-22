import { IActionUser } from "../combatant-context/action-user.js";
import { Item } from "../items/index.js";

export function combatantHasRequiredAttributesToUseItem(
  actionUser: IActionUser,
  item: Item
): boolean {
  const totalAttributes = actionUser.getTotalAttributes();

  const requirementsMet = Item.requirementsMet(item, totalAttributes);
  if (!requirementsMet) return false;
  return true;
}
