import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AdventuringParty, CombatantCondition, EntityId } from "@speed-dungeon/common";
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
      const combatantResult = AdventuringParty.getExpectedCombatant(party, entityId);

      const conditionRemovedOption = CombatantCondition.removeStacks(
        conditionId,
        combatantResult,
        numStacks
      );

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
