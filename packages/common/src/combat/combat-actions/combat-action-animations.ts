import { EntityAnimation } from "../../action-processing/game-update-commands.js";

export enum CombatActionAnimationPhase {
  Initial,
  Chambering,
  Delivery,
  RecoverySuccess,
  RecoveryInterrupted,
  Final,
}

export const ANIMATION_PHASE_NAME_STRINGS: Record<CombatActionAnimationPhase, string> = {
  [CombatActionAnimationPhase.Initial]: "Initial",
  [CombatActionAnimationPhase.Chambering]: "Chambering",
  [CombatActionAnimationPhase.Delivery]: "Delivery",
  [CombatActionAnimationPhase.RecoverySuccess]: "RecoverySuccess",
  [CombatActionAnimationPhase.RecoveryInterrupted]: "RecoveryInterrupted",
  [CombatActionAnimationPhase.Final]: "Final",
};

export type CombatActionCombatantAnimations = Partial<
  Record<CombatActionAnimationPhase, EntityAnimation | null>
>;
