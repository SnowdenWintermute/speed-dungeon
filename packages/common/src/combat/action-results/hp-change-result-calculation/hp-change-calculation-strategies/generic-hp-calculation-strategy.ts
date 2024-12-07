import { HpChangeCalculationStrategy } from "./index.js";
import { CombatAttribute, CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../../combat-actions/index.js";
import applyAffinityToHpChange from "../apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "../apply-crit-multiplier-to-hp-change.js";
import { HpChange } from "../../../hp-change-source-types.js";
import { MIN_HIT_CHANCE } from "../../../../app-consts.js";
import { randBetween } from "../../../../utils/index.js";

export class GenericHpCalculationStrategy implements HpChangeCalculationStrategy {
  rollHit(
    userCombatantProperties: CombatantProperties,
    targetCombatantProperties: CombatantProperties,
    unavoidable: boolean,
    targetWantsToBeHit: boolean
  ) {
    if (unavoidable) return true;

    const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
    const userAccuracy = userCombatAttributes[CombatAttribute.Accuracy];
    const targetCombatAttributes =
      CombatantProperties.getTotalAttributes(targetCombatantProperties);
    const targetEvasion = targetWantsToBeHit ? 0 : targetCombatAttributes[CombatAttribute.Evasion];
    const accComparedToEva = userAccuracy - targetEvasion;
    const percentChangeToHit = Math.max(MIN_HIT_CHANCE, accComparedToEva);
    const hitRoll = randBetween(0, 100);

    return hitRoll <= percentChangeToHit;
  }
  rollCrit(
    _hpChange: HpChange,
    _user: CombatantProperties,
    _target: CombatantProperties,
    _targetWantsToBeHit: boolean
  ) {
    throw new Error("Not implemented");
  }
  applyCritMultiplier(
    hpChange: HpChange,
    hpChangeProperties: CombatActionHpChangeProperties,
    user: CombatantProperties,
    _target: CombatantProperties
  ) {
    if (!hpChange.isCrit) return;
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    hpChange.value = applyCritMultiplierToHpChange(
      hpChangeProperties,
      userAttributes,
      hpChange.value
    );
  }
  applyKineticAffinities(hpChange: HpChange, target: CombatantProperties) {
    const kineticDamageType = hpChange.source.kineticDamageTypeOption;
    if (kineticDamageType === undefined) return;
    const targetAffinities =
      CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(target);
    const affinityValue = targetAffinities[kineticDamageType] || 0;
    hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
  }
  applyElementalAffinities(hpChange: HpChange, target: CombatantProperties) {
    const hpChangeElement = hpChange.source.elementOption;
    if (hpChangeElement === undefined) return;
    const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(target);
    const affinityValue = targetAffinities[hpChangeElement] || 0;
    hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
  }
  applyArmorClass(_hpChange: HpChange, _user: CombatantProperties, _target: CombatantProperties) {
    throw new Error("Not implemented");
  }
  applyResilience(_hpChange: HpChange, _user: CombatantProperties, _target: CombatantProperties) {
    throw new Error("Not implemented");
  }
}
