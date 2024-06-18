import { CombatAction } from "../combat-actions";
import { CombatActionTarget } from "../targeting/combat-action-targets";

export class ActionResult {
  hitPointChangesByEntityId: null | { [entityId: string]: number } = null;
  manaChangesByEntityId: null | { [entityId: string]: number } = null;
  manaCostsPaidByEntityId: null | { [entityId: string]: number } = null;
  missesByEntityId: null | string[] = null;
  critsByEntityId: null | string[] = null;
  itemIdsConsumedInEntityIdInventories: null | { [entityId: string]: string[] } = null;
  endsTurn: boolean = true;
  constructor(
    public userId: string,
    public action: CombatAction,
    public target: CombatActionTarget
  ) {}
}
