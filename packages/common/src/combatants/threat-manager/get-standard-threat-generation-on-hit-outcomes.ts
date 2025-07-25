import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";
import { ThreatCalculator } from "./threat-calculator.js";

export function getStandardThreatGenerationOnHitOutcomes(
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
    if (asShimmedUserOfTriggeredCondition)
      return asShimmedUserOfTriggeredCondition.condition.appliedBy.entityProperties.id;
    else return combatant.entityProperties.id;
  })();

  const userResult = AdventuringParty.getCombatant(party, userId);
  if (userResult instanceof Error) {
    const { asShimmedUserOfTriggeredCondition } = combatant.combatantProperties;
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
    monsters,
    characters
  );

  if (userIsOnPlayerTeam) {
    threatCalculator.updateThreatChangesForPlayerControlledCharacterHitOutcomes();
  } else {
    // this is a monster so damage dealt should reduce stable threat
    threatCalculator.updateThreatChangesForMonsterHitOutcomes();
  }

  console.log("threat changes: ", JSON.stringify(threatChanges, null, 2));

  return threatChanges;
}
