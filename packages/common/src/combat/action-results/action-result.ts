import { CombatAction } from "../combat-actions";
import { CombatActionTarget } from "../targeting/combat-action-targets";

export class ActionResult {
  hpChangesByEntityId: null | { [entityId: string]: number } = null;
  mpChangesByEntityId: null | { [entityId: string]: number } = null;
  missesByEntityId: null | { [entityId: string]: number } = null;
  critsByEntityId: null | { [entityId: string]: number } = null;
  itemIdsConsumedInEntityIdInventories: null | { [entityId: string]: string[] } = null;
  endsTurn: boolean = true;
  constructor(
    public userId: string,
    public action: CombatAction,
    public target: CombatActionTarget
  ) {}
}
