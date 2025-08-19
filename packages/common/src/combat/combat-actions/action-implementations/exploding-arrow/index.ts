import cloneDeep from "lodash.clonedeep";
import { AbilityType } from "../../../../abilities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CombatantTraitType } from "../../../../combatants/index.js";
import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";
import { EXPLODING_ARROW_PROJECTILE } from "./exploding-arrow-projectile.js";

const config: CombatActionComponentConfig = {
  ...ATTACK_RANGED_MAIN_HAND,
  hitOutcomeProperties: cloneDeep(EXPLODING_ARROW_PROJECTILE.hitOutcomeProperties),

  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.Fire },
    { type: AbilityType.Trait, traitType: CombatantTraitType.ExtraHotswapSlot },
  ],
  description: "Fire an arrow that applies a detonatable condition",
  getOnUseMessage(data) {
    return `${data.nameOfActionUser} uses Exploding Arrow (level ${data.actionLevel})`;
  },
  getConcurrentSubActions(context) {
    return [
      new CombatActionExecutionIntent(
        CombatActionName.ExplodingArrowProjectile,
        context.tracker.actionExecutionIntent.targets,
        context.tracker.actionExecutionIntent.level
      ),
    ];
  },
};

config.stepsConfig.steps[ActionResolutionStepType.PostActionUseCombatLogMessage] = {};

export const EXPLODING_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ExplodingArrowParent,
  config
);
