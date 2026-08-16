import { SkeletalAnimationName } from "../../../../app-consts.js";
import {
  EquipmentSlotId,
  HoldableSlotId,
} from "../../../../combatants/combatant-equipment/types.js";
import { ActionExecutionPhase } from "../action-execution-phase.js";
import { MeleeAttackAnimationType } from "./determine-melee-attack-animation-type.js";

export const MELEE_ATTACK_ANIMATION_NAMES: Record<
  MeleeAttackAnimationType,
  Record<HoldableSlotId, Record<ActionExecutionPhase, SkeletalAnimationName>>
> = {
  [MeleeAttackAnimationType.Unarmed]: {
    [EquipmentSlotId.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandUnarmedChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandUnarmedDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandUnarmedRecovery,
    },
    [EquipmentSlotId.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandUnarmedChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandUnarmedDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandUnarmedRecovery,
    },
  },
  [MeleeAttackAnimationType.OneHandSwing]: {
    [EquipmentSlotId.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandSwingRecovery,
    },
    [EquipmentSlotId.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandSwingRecovery,
    },
  },
  [MeleeAttackAnimationType.OneHandStab]: {
    [EquipmentSlotId.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.OffHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.OffHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.OffHandStabRecovery,
    },
    [EquipmentSlotId.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.MainHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.MainHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.MainHandStabRecovery,
    },
  },
  [MeleeAttackAnimationType.TwoHandSwing]: {
    [EquipmentSlotId.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandSwingRecovery,
    },
    [EquipmentSlotId.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandSwingChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandSwingDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandSwingRecovery,
    },
  },
  [MeleeAttackAnimationType.TwoHandStab]: {
    [EquipmentSlotId.OffHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandStabRecovery,
    },
    [EquipmentSlotId.MainHand]: {
      [ActionExecutionPhase.Chambering]: SkeletalAnimationName.TwoHandStabChambering,
      [ActionExecutionPhase.Delivery]: SkeletalAnimationName.TwoHandStabDelivery,
      [ActionExecutionPhase.Recovery]: SkeletalAnimationName.TwoHandStabRecovery,
    },
  },
};
