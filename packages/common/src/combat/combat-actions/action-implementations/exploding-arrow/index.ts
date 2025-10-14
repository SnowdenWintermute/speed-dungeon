import cloneDeep from "lodash.clonedeep";
import { AbilityType } from "../../../../abilities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CombatantTraitType } from "../../../../combatants/index.js";
import {
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionHitOutcomeProperties,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";
import { EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./exploding-arrow-projectile-hit-outcome-properties.js";
import { createHitOutcomeProperties } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ARROW_RESOURCE_CHANGE_CALCULATORS } from "../generic-action-templates/resource-change-calculation-templates/arrow.js";

// the purpose of projectile parent hit outcome properties is to show a description
// we'll clone the projectile's hit outcome properties so we can show the applied effects
// then we'll replace the resource change getters with the equation used to roll the
// values when the projectile is created since that takes a combatant which is what we'll
// have when asking for a description
const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
const base = cloneDeep(EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES);
hitOutcomeOverrides.resourceChangePropertiesGetters = ARROW_RESOURCE_CHANGE_CALCULATORS;
const hitOutcomeProperties = createHitOutcomeProperties(() => base, hitOutcomeOverrides);

const config: CombatActionComponentConfig = {
  ...cloneDeep(ATTACK_RANGED_MAIN_HAND),
  hitOutcomeProperties,
  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.Fire },
    { type: AbilityType.Trait, traitType: CombatantTraitType.ExtraHotswapSlot },
  ],
  description: "Fire an arrow that applies a detonatable condition",

  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} uses Exploding Arrow (level ${data.actionLevel})`;
    },
  }),

  hierarchyProperties: {
    ...ATTACK_RANGED_MAIN_HAND.hierarchyProperties,
    getConcurrentSubActions(context) {
      const expectedProjectile = context.tracker.getFirstExpectedSpawnedActionEntity();

      return [
        {
          user: expectedProjectile.actionEntity,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.ExplodingArrowProjectile,
            context.tracker.actionExecutionIntent.rank,
            context.tracker.actionExecutionIntent.targets
          ),
        },
      ];
    },
  },
};

config.stepsConfig.steps[ActionResolutionStepType.PostActionUseGameLogMessage] = {};

export const EXPLODING_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ExplodingArrowParent,
  config
);
