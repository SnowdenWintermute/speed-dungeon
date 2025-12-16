import makeAutoObservable from "mobx-store-inheritance";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import {
  ActionIntentAndUser,
  ActionUserContext,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  Combatant,
  CombatantCondition,
  CombatantProperties,
  CombatantTraitType,
  CombatAttribute,
  IdGenerator,
  MaxAndCurrent,
  runIfInBrowser,
} from "../../index.js";
import { CombatantConditionInit } from "../condition-config.js";

export function getEnsnaredEvasionChange(rank: number) {
  return rank * 25 * -1;
}

export class EnsnaredCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 1);
  removedOnDeath = true;
  multiplesAllowed = true;
  triggeredWhenHitBy = [];

  getAttributeModifiers(appliedTo: CombatantProperties) {
    return { [CombatAttribute.Evasion]: getEnsnaredEvasionChange(this.rank) };
  }

  onRemoved(
    this: CombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const { party } = actionUserContext;
    const appliedToCombatant = party.combatantManager.getExpectedCombatant(this.appliedTo);
    const triggeredActions: ActionIntentAndUser[] = [];
    const startFlyingIntentAndUser = getStartFlyingActionIntentIfAble(appliedToCombatant);
    if (startFlyingIntentAndUser !== undefined) {
      triggeredActions.push(startFlyingIntentAndUser);
    }

    return triggeredActions;
  }
}

export function getStartFlyingActionIntentIfAble(
  combatant: Combatant
): ActionIntentAndUser | undefined {
  if (
    combatant.combatantProperties.abilityProperties
      .getTraitProperties()
      .hasTraitType(CombatantTraitType.Flyer)
  ) {
    const combatantCanGainFlying = combatant.combatantProperties.abilityProperties.canGainFlying();

    // if they had more than one net on them, don't let them try to fly
    if (combatantCanGainFlying) {
      return {
        user: combatant,
        actionExecutionIntent: new CombatActionExecutionIntent(CombatActionName.StartFlying, 1, {
          type: CombatActionTargetType.Single,
          targetId: combatant.getEntityId(),
        }),
      };
    }
  }
}
