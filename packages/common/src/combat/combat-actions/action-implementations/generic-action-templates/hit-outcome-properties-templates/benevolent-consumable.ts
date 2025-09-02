import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";
import { BASIC_SPELL_HIT_OUTCOME_PROPERTIES } from "./basic-spell.js";

export const BENEVOLENT_CONSUMABLE_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...BASIC_SPELL_HIT_OUTCOME_PROPERTIES,
  getIsBlockable: (user) => false,
  getUnmodifiedCritChance: () => null,
  getCritMultiplier: () => null,
  getArmorPenetration: () => 0,
};
