import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat/combat-actions/combat-action-names.js";
import { ThreatCalculator } from "./threat-calculator.js";

export function getStandardThreatChangesOnHitOutcomes(
  context: ActionResolutionStepContext,
  hitOutcomes: CombatActionHitOutcomes
) {
  if (!hitOutcomes.hitPointChanges) return null;
  const { party, combatant } = context.combatantContext;

  const allCombatantsResult = AdventuringParty.getAllCombatants(party);
  if (allCombatantsResult instanceof Error) throw allCombatantsResult;
  const { monsters, characters } = allCombatantsResult;

  const userId = (() => {
    const { asShimmedUserOfTriggeredCondition } = combatant.combatantProperties;
    if (asShimmedUserOfTriggeredCondition) {
      return asShimmedUserOfTriggeredCondition.condition.appliedBy.entityProperties.id;
    } else return combatant.entityProperties.id;
  })();

  const userResult = AdventuringParty.getCombatant(party, userId);
  const { asShimmedUserOfTriggeredCondition } = combatant.combatantProperties;
  if (userResult instanceof Error) {
    // the combatant that applied this condition is no longer in the battle
    if (asShimmedUserOfTriggeredCondition) return null;
    throw userResult;
  }

  const userIsOnPlayerTeam = Object.keys(characters).includes(userId);

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

  console.log(
    COMBAT_ACTION_NAME_STRINGS[context.tracker.actionExecutionIntent.actionName],
    "threat changes: ",
    JSON.stringify(threatChanges, null, 2)
  );

  return threatChanges;
}
