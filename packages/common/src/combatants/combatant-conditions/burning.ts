import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { Combatant } from "../index.js";
import { CombatActionIntent, CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { BASE_CONDITION_TICK_MOVEMENT_RECOVERY } from "../../combat/turn-order/consts.js";

export class BurningCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.Burning;
  stacksOption = new MaxAndCurrent(10, 1);
  intent = CombatActionIntent.Malicious;

  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {}

  onTick() {
    // deal fire damage to combatant
    // remove a stack
  }
  getTickSpeed = () => this.level * BASE_CONDITION_TICK_MOVEMENT_RECOVERY;
  triggeredWhenHitBy(actionName: CombatActionName) {
    // anything that removes burning
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(
    combatantContext: CombatantContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    return {
      numStacksRemoved: this.stacksOption.current,
      triggeredActions: [],
    };
  }

  getCosmeticEffectWhileActive = () => [];
}
