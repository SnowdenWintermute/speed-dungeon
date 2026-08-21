import cloneDeep from "lodash.clonedeep";
import { IActionUser } from "../../action-user-context/action-user.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { BASIC_TARGET_DUMMY } from "../../combatants/target-dummies/index.js";
import { HitOutcomeMitigationCalculator } from "../action-results/action-hit-outcome-calculation/hit-outcome-mitigation-calculator.js";
import { CombatActionResource } from "./combat-action-hit-outcome-properties.js";
import { CombatActionComponent } from "./index.js";

export function getTooltipOffensiveSpec(
  action: CombatActionComponent,
  user: IActionUser,
  targetOption?: CombatantProperties
) {
  const usingDummy = targetOption === undefined;

  const target = targetOption || BASIC_TARGET_DUMMY.combatantProperties;

  const hpChangeGetterOption =
    action.hitOutcomeProperties.resourceChangePropertiesGetters[CombatActionResource.HitPoints];

  if (hpChangeGetterOption === undefined) {
    return undefined;
  }

  const hpChangeProperties = hpChangeGetterOption(user, action.hitOutcomeProperties, 1, target);

  if (hpChangeProperties === null) {
    return undefined;
  }

  const modified = cloneDeep(hpChangeProperties);

  modified.baseValues.mult(action.hitOutcomeProperties.resourceChangeValuesModifier);

  const hpChangeRange = modified.baseValues;

  const hitChance = HitOutcomeMitigationCalculator.getActionHitChance(
    action,
    user,
    1,
    !usingDummy,
    target
  );

  const { hitOutcomeProperties } = action;

  const critMultiplierOption = hitOutcomeProperties.getCritMultiplier(user, 1);

  const critChance = HitOutcomeMitigationCalculator.getActionCritChance(
    action,
    1,
    user,
    target,
    !usingDummy,
    CombatActionResource.HitPoints,
    hpChangeProperties.resourceChangeSource
  );

  return { hpChangeRange, hitChance, critChance, critMultiplierOption };
}
