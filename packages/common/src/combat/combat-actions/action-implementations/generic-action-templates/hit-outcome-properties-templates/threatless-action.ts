import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";
import { BENEVOLENT_CONSUMABLE_HIT_OUTCOME_PROPERTIES } from "./benevolent-consumable.js";

export const THREATLESS_ACTION_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...BENEVOLENT_CONSUMABLE_HIT_OUTCOME_PROPERTIES,
  getThreatChangesOnHitOutcomes: () => null,
};
