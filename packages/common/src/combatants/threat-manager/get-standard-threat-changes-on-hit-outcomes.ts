import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat/combat-actions/combat-action-names.js";
import { ThreatCalculator } from "./threat-calculator.js";

export function getStandardThreatChangesOnHitOutcomes(
  context: ActionResolutionStepContext,
  hitOutcomes: CombatActionHitOutcomes
) {
  const { party, actionUser } = context.actionUserContext;

  const allCombatantsResult = AdventuringParty.getAllCombatants(party);
  if (allCombatantsResult instanceof Error) throw allCombatantsResult;
  const { characters } = allCombatantsResult;

  const userIdToCredit = actionUser.getIdOfEntityToCreditWithThreat();
  const userResult = AdventuringParty.getCombatant(party, userIdToCredit);

  if (userResult instanceof Error) {
    // the combatant that applied this condition is no longer in the battle
    throw userResult;
  }

  const userIsOnPlayerTeam = Object.keys(characters).includes(userIdToCredit);

  const threatChanges = new ThreatChanges();
  const threatCalculator = new ThreatCalculator(
    threatChanges,
    hitOutcomes,
    party,
    userResult,
    context.tracker.actionExecutionIntent.actionName
  );

  if (userIsOnPlayerTeam) {
    threatCalculator.updateThreatChangesForPlayerControlledCharacterHitOutcomes();
  } else {
    // this is a monster so damage dealt should reduce stable threat
    threatCalculator.updateThreatChangesForMonsterHitOutcomes();
  }

  if (threatChanges.isEmpty()) return null;

  return threatChanges;
}
