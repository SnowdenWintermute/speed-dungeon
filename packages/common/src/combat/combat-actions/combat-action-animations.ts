import { EntityAnimation } from "../../action-processing/game-update-commands.js";

export enum CombatActionAnimationPhase {
  Initial,
  Chambering,
  Delivery,
  RecoverySuccess,
  RecoveryInterrupted,
  Final,
}

export type CombatActionCombatantAnimations = Record<
  CombatActionAnimationPhase,
  EntityAnimation | null
>;
