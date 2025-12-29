import { ActionResolutionStepContext } from "../../action-processing/action-steps/index.js";
import { CombatantId, EntityId } from "../../aliases.js";
import { CombatActionHitOutcomes } from "../../combat/action-results/action-hit-outcome-calculation/index.js";
import { ThreatChanges } from "../../combat/action-results/action-hit-outcome-calculation/resource-changes.js";
import { ThreatCalculator } from "./threat-calculator.js";

export function getStandardThreatChangesOnHitOutcomes(
  context: ActionResolutionStepContext,
  hitOutcomes: CombatActionHitOutcomes
) {
  const { party, actionUser } = context.actionUserContext;

  const userIdToCredit: EntityId = actionUser.getIdOfEntityToCreditWithThreat();

  const userOption = party.combatantManager.getCombatantOption(userIdToCredit);

  if (userOption === undefined) {
    // the combatant that applied this condition is no longer in the battle
    return null;
  }

  const threatChanges = new ThreatChanges();
  const threatCalculator = new ThreatCalculator(
    threatChanges,
    hitOutcomes,
    party,
    userOption,
    context.tracker.actionExecutionIntent.actionName
  );

  const partyCombatants = party.combatantManager.getPartyMemberCombatants();
  const userIsOnPlayerTeam = partyCombatants
    .map((combatant) => combatant.getEntityId())
    .includes(userIdToCredit as CombatantId);

  if (userIsOnPlayerTeam) {
    threatCalculator.updateThreatChangesForPlayerControlledCharacterHitOutcomes();
  } else {
    // this is a monster so damage dealt should reduce stable threat
    threatCalculator.updateThreatChangesForMonsterHitOutcomes();
  }

  if (threatChanges.isEmpty()) return null;

  return threatChanges;
}
