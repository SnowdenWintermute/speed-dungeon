import { CombatAction } from "../combat-actions/index.js";
import { HpChangeSource } from "../hp-change-source-types.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { DurabilityChangesByEntityId } from "./calculate-action-durability-changes.js";

// @TODO @PERF - change from null to option properties so we don't send the key names in the packets
export class ActionResult {
  hitPointChangesByEntityId: null | {
    [entityId: string]: { source: HpChangeSource; value: number };
  } = null;
  manaChangesByEntityId: null | { [entityId: string]: number } = null;
  manaCost: number = 0;
  missesByEntityId: null | string[] = null;
  critsByEntityId: null | string[] = null;
  itemIdsConsumed: string[] = [];
  endsTurn: boolean = true;
  targetIds: string[] = [];
  durabilityChanges?: DurabilityChangesByEntityId;
  constructor(
    public userId: string,
    public action: CombatAction,
    public target: CombatActionTarget
  ) {}
}
