import { RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";

export default function getDamageAfterResilience(
  baseValue: number,
  userCombatAttributes: Partial<Record<CombatAttribute, number>>,
  targetCombatAttributes: Record<CombatAttribute, number>
) {
  const targetResilience = targetCombatAttributes[CombatAttribute.Spirit];
  const resiliencePen = 0;
  const penetratedResilience = Math.max(0, targetResilience - resiliencePen);
  const damageReductionPercentage = Math.min(
    100,
    penetratedResilience * RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO
  );
  const damageReductionMultiplier = 1.0 - damageReductionPercentage / 100;

  return baseValue * damageReductionMultiplier;
}
