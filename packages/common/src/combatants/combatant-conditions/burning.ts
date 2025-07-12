import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "./index.js";
import { Combatant, createShimmedUserOfTriggeredCondition } from "../index.js";
import { CombatActionIntent, CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { BASE_CONDITION_TICK_MOVEMENT_RECOVERY } from "../../combat/turn-order/consts.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { immerable } from "immer";

export class BurningCombatantCondition implements CombatantCondition {
  [immerable] = true;
  name = CombatantConditionName.Burning;
  stacksOption = new MaxAndCurrent(10, 1);
  intent = CombatActionIntent.Malicious;
  tickProperties = new ConditionTickProperties(
    () => this.level * BASE_CONDITION_TICK_MOVEMENT_RECOVERY,
    (context: CombatantContext) => {
      const user = createShimmedUserOfTriggeredCondition(
        COMBATANT_CONDITION_NAME_STRINGS[this.name],
        this,
        context.combatant.entityProperties.id
      );

      return {
        numStacksRemoved: 1,
        triggeredAction: {
          user,
          actionExecutionIntent: {
            actionName: CombatActionName.Fire,
            targets: {
              type: CombatActionTargetType.Single,
              targetId: context.combatant.entityProperties.id,
            },
            getConsumableType: () => null,
          },
        },
      };
    }
  );

  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {}

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
