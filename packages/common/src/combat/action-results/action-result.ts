import { CombatAction } from "../combat-actions/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";

export class ActionResult {
  hitPointChangesByEntityId: null | { [entityId: string]: number } = null;
  manaChangesByEntityId: null | { [entityId: string]: number } = null;
  manaCost: number = 0;
  missesByEntityId: null | string[] = null;
  critsByEntityId: null | string[] = null;
  itemIdsConsumed: string[] = [];
  endsTurn: boolean = true;
  targetIds: string[] = [];
  constructor(
    public userId: string,
    public action: CombatAction,
    public target: CombatActionTarget
  ) {}
}
