import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AdventuringParty, EntityId } from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "../start-or-stop-cosmetic-effect";

export function handleRemovedConditionStacks(
  removedConditionStacks: Record<
    string,
    {
      conditionId: EntityId;
      numStacks: number;
    }[]
  >,
  party: AdventuringParty
) {
  for (const [entityId, conditionIdAndStacks] of Object.entries(removedConditionStacks)) {
    for (const { conditionId, numStacks } of conditionIdAndStacks) {
      const combatantResult = party.combatantManager.getExpectedCombatant(entityId);

      const { conditionManager } = combatantResult.combatantProperties;
      const conditionRemovedOption = conditionManager.removeStacks(conditionId, numStacks);

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
