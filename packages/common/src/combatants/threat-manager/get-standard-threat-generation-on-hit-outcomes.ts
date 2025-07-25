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
  const user = combatant;

  const allCombatantsResult = AdventuringParty.getAllCombatants(party);
  if (allCombatantsResult instanceof Error) throw allCombatantsResult;
  const { monsters, characters } = allCombatantsResult;

  const userIsOnPlayerTeam = Object.keys(characters).includes(user.entityProperties.id);

  const threatChanges = new ThreatChanges();
  const threatCalculator = new ThreatCalculator(
    threatChanges,
    hitOutcomes,
    party,
    user,
    monsters,
    characters
  );

  if (userIsOnPlayerTeam) {
    threatCalculator.updateThreatChangesForPlayerControlledCharacterHitOutcomes();
  } else {
    // this is a monster so damage dealt should reduce stable threat
    threatCalculator.updateThreatChangesForMonsterHitOutcomes();
  }

  console.log("threat changes: ", threatChanges);

  return threatChanges;
}
