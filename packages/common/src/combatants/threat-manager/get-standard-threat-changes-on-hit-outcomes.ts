import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { ThreatCalculator } from "./threat-calculator.js";

export function getStandardThreatChangesOnHitOutcomes(
  context: ActionResolutionStepContext,
  hitOutcomes: CombatActionHitOutcomes
) {
  const { party, actionUser } = context.actionUserContext;

  const userIdToCredit = actionUser.getIdOfEntityToCreditWithThreat();

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
    .includes(userIdToCredit);

  if (userIsOnPlayerTeam) {
    console.log("user is on player team, user:", userOption.getName());
    threatCalculator.updateThreatChangesForPlayerControlledCharacterHitOutcomes();
  } else {
    console.log("user is on DUNGEON team, user:", userOption.getName());
    // this is a monster so damage dealt should reduce stable threat
    threatCalculator.updateThreatChangesForMonsterHitOutcomes();
  }

  if (threatChanges.isEmpty()) return null;

  return threatChanges;
}
