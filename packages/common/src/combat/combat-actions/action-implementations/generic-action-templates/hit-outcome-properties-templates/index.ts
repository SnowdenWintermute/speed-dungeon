import cloneDeep from "lodash.clonedeep";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties";
import { BASIC_ATTACK_HIT_OUTCOME_PROPERTIES } from "./basic-attack.js";
import { MELEE_ATTACK_HIT_OUTCOME_PROPERTIES } from "./melee-attack.js";
import { RANGED_ACTION_HIT_OUTCOME_PROPERTIES } from "./ranged-action.js";
import { BOW_ATTACK_HIT_OUTCOME_PROPERTIES } from "./bow-attack.js";
import { BASIC_SPELL_HIT_OUTCOME_PROPERTIES } from "./basic-spell.js";
import { BENEVOLENT_CONSUMABLE_HIT_OUTCOME_PROPERTIES } from "./benevolent-consumable.js";

export const HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS = {
  BASIC_ATTACK: () => cloneDeep(BASIC_ATTACK_HIT_OUTCOME_PROPERTIES),
  MELEE_ATTACK: () => cloneDeep(MELEE_ATTACK_HIT_OUTCOME_PROPERTIES),
  RANGED_ACTION: () => cloneDeep(RANGED_ACTION_HIT_OUTCOME_PROPERTIES),
  BOW_ATTACK: () => cloneDeep(BOW_ATTACK_HIT_OUTCOME_PROPERTIES),
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_HIT_OUTCOME_PROPERTIES),
  BENEVOLENT_CONSUMABLE: () => cloneDeep(BENEVOLENT_CONSUMABLE_HIT_OUTCOME_PROPERTIES),
};

export function createHitOutcomeProperties(
  templateGetter: () => CombatActionHitOutcomeProperties,
  overrides: Partial<CombatActionHitOutcomeProperties>
): CombatActionHitOutcomeProperties {
  const base = templateGetter();

  return {
    ...base,
    ...overrides,
    resourceChangePropertiesGetters: {
      ...base.resourceChangePropertiesGetters,
      ...overrides.resourceChangePropertiesGetters,
    },
  };
}
