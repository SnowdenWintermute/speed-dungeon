import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function checkIfTargetWantsToBeHit(
  action: CombatActionComponent,
  user: CombatantProperties,
  targetCombatantProperties: CombatantProperties
) {
  const hpChangePropertiesGetterOption =
    action.hitOutcomeProperties.resourceChangePropertiesGetters[CombatActionResource.HitPoints];
  const hpChangePropertiesOption = hpChangePropertiesGetterOption
    ? hpChangePropertiesGetterOption(user, targetCombatantProperties)
    : null;

  // regardless of the action intent, don't try to evade if would be healed
  if (hpChangePropertiesOption) {
    const { resourceChangeSource } = hpChangePropertiesOption;
    const { isHealing } = resourceChangeSource;

    const isUndead = CombatantProperties.hasTraitType(
      targetCombatantProperties,
      CombatantTraitType.Undead
    );

    if (isHealing && isUndead) return false;
    if (isHealing) return true;

    const { elementOption } = resourceChangeSource;
    if (elementOption) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const targetAffinity = targetAffinities[elementOption];
      if (targetAffinity && targetAffinity > 100) return true;
    }
  }

  // finally resolve based on action intent
  if (action.targetingProperties.intent === CombatActionIntent.Malicious) return false;
  else return true;
}
