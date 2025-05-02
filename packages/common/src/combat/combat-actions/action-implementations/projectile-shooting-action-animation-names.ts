import { SkeletalAnimationName } from "../../../app-consts.js";
import { ActionExecutionPhase } from "./action-execution-phase.js";

export enum ProjectileShootingActionType {
  Bow,
  Spell,
}
export const PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES: Record<
  ProjectileShootingActionType,
  Record<ActionExecutionPhase, SkeletalAnimationName>
> = {
  [ProjectileShootingActionType.Bow]: {
    [ActionExecutionPhase.Chambering]: SkeletalAnimationName.BowChambering,
    [ActionExecutionPhase.Delivery]: SkeletalAnimationName.BowDelivery,
    [ActionExecutionPhase.Recovery]: SkeletalAnimationName.BowRecovery,
  },
  [ProjectileShootingActionType.Spell]: {
    [ActionExecutionPhase.Chambering]: SkeletalAnimationName.CastSpellChambering,
    [ActionExecutionPhase.Delivery]: SkeletalAnimationName.CastSpellDelivery,
    [ActionExecutionPhase.Recovery]: SkeletalAnimationName.CastSpellRecovery,
  },
};
