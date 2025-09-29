import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { MagicalElement } from "../../../magical-elements.js";
import { createHitOutcomeProperties } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { projectileSpellResourceChangeCalculatorFactory } from "../generic-action-templates/resource-change-calculation-templates/projectile-spell.js";
import cloneDeep from "lodash.clonedeep";
import { ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./ice-bolt-projectile-hit-outcome-properties.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};

const base = cloneDeep(ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES);

hitOutcomeOverrides.resourceChangePropertiesGetters =
  projectileSpellResourceChangeCalculatorFactory(MagicalElement.Ice);

export const ICE_BOLT_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  () => base,
  hitOutcomeOverrides
);
