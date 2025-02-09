import { AnimationName } from "../../app-consts.js";

export enum CombatActionAnimationCategory {
  StartUse,
  SuccessRecovery,
  InterruptedRecovery,
}

export type CombatActionCombatantAnimations = Record<CombatActionAnimationCategory, AnimationName>;
