import {
  AdventuringParty,
  Battle,
  CombatantCondition,
  deserializeCondition,
  HitOutcome,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "../start-or-stop-cosmetic-effect";
import { SerializedOf } from "@speed-dungeon/common";

export function handleAppliedConditions(
  appliedConditions: Partial<
    Record<HitOutcome, Record<string, SerializedOf<CombatantCondition>[]>>
  >,
  party: AdventuringParty,
  battleOption: Battle | null
) {
  for (const [_hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
    appliedConditions
  )) {
    for (const [entityId, conditions] of Object.entries(entityAppliedConditions)) {
      const combatantResult = party.combatantManager.getExpectedCombatant(entityId);
      for (const condition of conditions) {
        const deserializedCondition = deserializeCondition(condition);
        deserializedCondition.makeObservable();

        combatantResult.combatantProperties.conditionManager.applyCondition(deserializedCondition);

        if (battleOption !== null) {
          battleOption.turnOrderManager.turnSchedulerManager.addConditionToTurnOrder(
            party,
            deserializedCondition
          );
        }

        startOrStopCosmeticEffects(
          deserializedCondition.getCosmeticEffectWhileActive?.(combatantResult.entityProperties.id),
          []
        );
      }
    }
  }
}
