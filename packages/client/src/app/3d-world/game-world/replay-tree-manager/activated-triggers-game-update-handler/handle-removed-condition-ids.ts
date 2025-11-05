import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AdventuringParty } from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "../start-or-stop-cosmetic-effect";

export function handleRemovedConditionIds(
  removedConditionIds: Record<string, string[]>,
  party: AdventuringParty
) {
  for (const [entityId, conditionIdsRemoved] of Object.entries(removedConditionIds)) {
    for (const conditionId of conditionIdsRemoved) {
      const combatantResult = party.combatantManager.getExpectedCombatant(entityId);
      if (combatantResult instanceof Error) return combatantResult;

      const { conditionManager } = combatantResult.combatantProperties;
      const conditionRemovedOption = conditionManager.removeConditionById(conditionId);

      if (conditionRemovedOption) {
        const targetModelOption = getGameWorld().modelManager.findOne(entityId);
        startOrStopCosmeticEffects(
          [],
          conditionRemovedOption.getCosmeticEffectWhileActive(targetModelOption.entityId)
        );
      }
    }
  }
}
