import {
  AdventuringParty,
  Battle,
  CombatantCondition,
  deserializeCondition,
  HitOutcome,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "../start-or-stop-cosmetic-effect";

export function handleAppliedConditions(
  appliedConditions: Partial<Record<HitOutcome, Record<string, CombatantCondition[]>>>,
  party: AdventuringParty,
  battleOption: Battle | null
) {
  for (const [_hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
    appliedConditions
  )) {
    for (const [entityId, conditions] of Object.entries(entityAppliedConditions)) {
      const combatantResult = party.combatantManager.getExpectedCombatant(entityId);
      for (let condition of conditions) {
        const deserializedCondition = deserializeCondition(condition);

        CombatantCondition.applyToCombatant(
          deserializedCondition,
          combatantResult,
          battleOption,
          party
        );

        startOrStopCosmeticEffects(
          deserializedCondition.getCosmeticEffectWhileActive(combatantResult.entityProperties.id),
          []
        );
      }
    }
  }
}
