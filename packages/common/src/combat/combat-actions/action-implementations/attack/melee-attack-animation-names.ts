import { SkeletalAnimationName } from "../../../../app-consts.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { ActionExecutionPhase } from "../action-execution-phase.js";
import { MeleeAttackAnimationType } from "./determine-melee-attack-animation-type.js";

export const MELEE_ATTACK_ANIMATION_NAMES: Record<
  MeleeAttackAnimationType,
  Record<HoldableSlotType, Record<ActionExecutionPhase, SkeletalAnimationName>>
> = {
  [MeleeAttackAnimationType.Unarmed]: {
    [HoldableSlotType.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandUnarmedChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandUnarmedDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandUnarmedRecovery,
    },
    [HoldableSlotType.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandUnarmedChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandUnarmedDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandUnarmedRecovery,
    },
  },
  [MeleeAttackAnimationType.OneHandSwing]: {
    [HoldableSlotType.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandSwingRecovery,
    },
    [HoldableSlotType.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandSwingRecovery,
    },
  },
  [MeleeAttackAnimationType.OneHandStab]: {
    [HoldableSlotType.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandStabRecovery,
    },
    [HoldableSlotType.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandStabRecovery,
    },
  },
  [MeleeAttackAnimationType.TwoHandSwing]: {
    [HoldableSlotType.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandSwingRecovery,
    },
    [HoldableSlotType.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandSwingRecovery,
    },
  },
  [MeleeAttackAnimationType.TwoHandStab]: {
    [HoldableSlotType.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandStabRecovery,
    },
    [HoldableSlotType.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandStabRecovery,
    },
  },
};
