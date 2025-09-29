import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { CombatantProperties, CombatAttribute } from "../../../../../combatants/index.js";
import { NumberRange } from "../../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../../hp-change-source-types.js";
import { MagicalElement } from "../../../../magical-elements.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../../combat-action-resource-change-properties.js";

const spellLevelHpChangeValueModifier = 0.75;

export function projectileSpellResourceChangeCalculatorFactory(
  magicalElementOption: null | MagicalElement
) {
  return {
    [CombatActionResource.HitPoints]: (
      user: IActionUser,
      hitOutcomeProperties: CombatActionHitOutcomeProperties,
      actionRank: number,
      primaryTargetCombatantProperties: CombatantProperties
    ) => {
      const hpChangeSourceConfig: ResourceChangeSourceConfig = {
        category: ResourceChangeSourceCategory.Magical,
        kineticDamageTypeOption: null,
        isHealing: false,
        lifestealPercentage: null,
      };

      if (magicalElementOption !== undefined)
        hpChangeSourceConfig.elementOption = magicalElementOption;

      const baseValues = new NumberRange(4, 8);

      const userLevel = user.getLevel();

      // just get some extra damage for combatant level
      baseValues.add(userLevel - 1);

      baseValues.mult(1 + spellLevelHpChangeValueModifier * (actionRank - 1));

      // get greater benefits from a certain attribute the higher level a combatant is
      addCombatantLevelScaledAttributeToRange({
        range: baseValues,
        userTotalAttributes: user.getTotalAttributes(),
        userLevel,
        attribute: CombatAttribute.Spirit,
        normalizedAttributeScalingByCombatantLevel: 1,
      });

      const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
      const hpChangeProperties: CombatActionResourceChangeProperties = {
        resourceChangeSource,
        baseValues,
      };

      baseValues.floor(1);

      return hpChangeProperties;
    },
  };
}
