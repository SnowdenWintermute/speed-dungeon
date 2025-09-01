import cloneDeep from "lodash.clonedeep";
import { AbilityType } from "../../../../abilities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CombatantConditionName, CombatantTraitType } from "../../../../combatants/index.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionOrigin,
  FriendOrFoe,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "../attack/attack-ranged-main-hand-projectile.js";

// declaring the projectile properties in the parent action since doing the reverse
// caused a circular dependency bug
export const EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES = cloneDeep(
  ATTACK_RANGED_MAIN_HAND_PROJECTILE.hitOutcomeProperties
);

EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES.getAppliedConditions = (user, actionLevel) => {
  return [
    {
      conditionName: CombatantConditionName.PrimedForExplosion,
      level: actionLevel,
      stacks: 1,
      appliedBy: { entityProperties: user.entityProperties, friendOrFoe: FriendOrFoe.Hostile },
    },
  ];
};

const config: CombatActionComponentConfig = {
  ...ATTACK_RANGED_MAIN_HAND,
  hitOutcomeProperties: GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Ranged],

  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.Fire },
    { type: AbilityType.Trait, traitType: CombatantTraitType.ExtraHotswapSlot },
  ],
  description: "Fire an arrow that applies a detonatable condition",

  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} uses Exploding Arrow (level ${data.actionLevel})`;
    },
  }),

  hierarchyProperties: {
    ...ATTACK_RANGED_MAIN_HAND.hierarchyProperties,
    getConcurrentSubActions(context) {
      return [
        new CombatActionExecutionIntent(
          CombatActionName.ExplodingArrowProjectile,
          context.tracker.actionExecutionIntent.targets,
          context.tracker.actionExecutionIntent.level
        ),
      ];
    },
  },
};

config.stepsConfig.steps[ActionResolutionStepType.PostActionUseCombatLogMessage] = {};

export const EXPLODING_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ExplodingArrowParent,
  config
);

EXPLODING_ARROW_PARENT.hitOutcomeProperties = cloneDeep(
  EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES
);
