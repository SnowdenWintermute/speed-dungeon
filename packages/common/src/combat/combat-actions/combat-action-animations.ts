import { AnimationName } from "../../app-consts.js";

export enum CombatActionAnimationCategory {
  Chambering,
  Delivery,
  RecoveryAfterSuccess,
  RecoveryAfterInterrupt,
}

export type CombatActionCombatantAnimations = Record<CombatActionAnimationCategory, AnimationName>;
