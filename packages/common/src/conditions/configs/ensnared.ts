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
    return { [CombatAttribute.Evasion]: this.rank * 25 * -1 };
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
    if (
      appliedToCombatant.combatantProperties.abilityProperties
        .getTraitProperties()
        .hasTraitType(CombatantTraitType.Flyer)
    ) {
      const combatantCanGainFlying =
        appliedToCombatant.combatantProperties.abilityProperties.canGainFlying();

      // if they had more than one net on them, don't let them try to fly
      if (combatantCanGainFlying) {
        triggeredActions.push({
          user: appliedToCombatant,
          actionExecutionIntent: new CombatActionExecutionIntent(CombatActionName.StartFlying, 1, {
            type: CombatActionTargetType.Single,
            targetId: appliedToCombatant.getEntityId(),
          }),
        });
      }
    }

    return triggeredActions;
  }
}
