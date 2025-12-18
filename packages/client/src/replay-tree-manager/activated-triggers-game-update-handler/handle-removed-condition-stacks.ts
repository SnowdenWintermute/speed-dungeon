import { AdventuringParty, EntityId } from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "../start-or-stop-cosmetic-effect";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";

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
        const targetModelOption = getGameWorldView().modelManager.findOne(entityId);

        startOrStopCosmeticEffects(
          [],
          conditionRemovedOption.getCosmeticEffectWhileActive?.(targetModelOption.entityId)
        );
      }
    }
  }
}
