import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "../attack/attack-ranged-main-hand.js";

const config: CombatActionComponentConfig = {
  ...ATTACK_RANGED_MAIN_HAND,
  description: "Fire an arrow that applies a detonatable condition",
  getConcurrentSubActions(context) {
    return [
      new CombatActionExecutionIntent(
        CombatActionName.ExplodingArrowProjectile,
        context.tracker.actionExecutionIntent.targets
      ),
    ];
  },
};

export const EXPLODING_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ExplodingArrowParent,
  config
);
