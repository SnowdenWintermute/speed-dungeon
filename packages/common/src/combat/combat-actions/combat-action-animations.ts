import { EntityAnimation } from "../../action-processing/game-update-commands.js";

export enum CombatActionAnimationPhase {
  Initial,
  Chambering,
  Delivery,
  RecoverySuccess,
  RecoveryInterrupted,
  Final,
}

export type CombatActionCombatantAnimations = Partial<
  Record<CombatActionAnimationPhase, EntityAnimation | null>
>;
