import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { Combatant } from "../../combatants/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { ActionIntentAndUser } from "../../action-processing/action-steps/index.js";
import { CombatantTraitType } from "../../combatants/combatant-traits/trait-types.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { CombatantCondition } from "../index.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { ActionRank } from "../../aliases.js";
import { AdventuringParty } from "../../adventuring-party/index.js";

export function getEnsnaredEvasionChange(rank: number) {
  return rank * 25 * -1;
}

export class EnsnaredCondition extends CombatantCondition {
  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 1);
  removedOnDeath = true;
  multiplesAllowed = true;
  triggeredWhenHitBy = [];

  getAttributeModifiers(appliedTo: CombatantProperties) {
    return { [CombatAttribute.Evasion]: getEnsnaredEvasionChange(this.rank) };
  }

  onRemoved(this: CombatantCondition, party: AdventuringParty) {
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
        actionExecutionIntent: new CombatActionExecutionIntent(
          CombatActionName.StartFlying,
          1 as ActionRank,
          {
            type: CombatActionTargetType.Single,
            targetId: combatant.getEntityId(),
          }
        ),
      };
    }
  }
}
