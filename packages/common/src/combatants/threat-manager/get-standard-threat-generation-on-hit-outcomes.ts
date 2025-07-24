import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../../combat/action-results/index.js";

export function getStandardThreatGenerationOnHitOutcomes(
  context: ActionResolutionStepContext,
  hitOutcomes: CombatActionHitOutcomes
) {
  if (!hitOutcomes.hitPointChanges) return null;
  const { game, party, combatant } = context.combatantContext;
  const user = combatant;
  // AI users don't generate threat, although when implementing summoned creatures with AI this will need to change
  if (!user.combatantProperties.controllingPlayer) return null;

  const allCombatantsResult = AdventuringParty.getAllCombatants(party);
  if (allCombatantsResult instanceof Error) throw allCombatantsResult;
  const { monsters, characters } = allCombatantsResult;

  const threatChanges = new ThreatChanges();

  for (const [entityId, hitPointChange] of hitOutcomes.hitPointChanges.getRecords()) {
    const targetCombatantResult = AdventuringParty.getCombatant(party, entityId);
    if (targetCombatantResult instanceof Error) throw targetCombatantResult;
    const targetIsPlayer = targetCombatantResult.combatantProperties.controllingPlayer;

    // for every damage done to an AI by a player, add threat to that AI
    if (targetCombatantResult.combatantProperties.threatManager)
      threatChanges.addRecord(entityId, {
        userId: user.entityProperties.id,
        value: hitPointChange.value * -1,
      });
    // for every healing done to a player by a player, add threat to all AI
    else if (targetIsPlayer) {
      for (const [monsterId, monster] of Object.entries(monsters)) {
        if (!monster.combatantProperties.threatManager) continue;
        threatChanges.addRecord(monsterId, {
          userId: user.entityProperties.id,
          value: hitPointChange.value,
        });
      }
    }
  }

  return threatChanges;
}
