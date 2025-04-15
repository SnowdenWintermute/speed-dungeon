import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";

export function convertResourceChangeValueToFinalSign(hpChange: ResourceChange, target: CombatantProperties) {
  const targetIsUndead = CombatantProperties.hasTraitType(target, CombatantTraitType.Undead);
  // if it wasn't intended as healing, but is actually healing target due to affinities,
  // don't "un healify" the hp change here
  const targetIsBeingHealedFromAffinities = hpChange.value > 0;

  if (!(hpChange.source.isHealing && targetIsBeingHealedFromAffinities && !targetIsUndead)) {
    hpChange.value *= -1;
  }
}
