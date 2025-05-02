import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";

export function applyCritMultiplier(
  hpChange: ResourceChange,
  action: CombatActionComponent,
  user: CombatantProperties,
  _target: CombatantProperties
) {
  if (!hpChange.isCrit) return;
  const critMultiplier = action.hitOutcomeProperties.getCritMultiplier(user);
  hpChange.value *= critMultiplier;
}
