import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { HpChange } from "../../hp-change-source-types.js";

export function applyCritMultiplier(
  hpChange: HpChange,
  action: CombatActionComponent,
  user: CombatantProperties,
  _target: CombatantProperties
) {
  if (!hpChange.isCrit) return;
  const critMultiplier = action.getCritMultiplier(user);
  hpChange.value *= critMultiplier;
}
