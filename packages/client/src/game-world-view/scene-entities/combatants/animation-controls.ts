import {
  AnimationTimingType,
  AnimationType,
  Combatant,
  CombatantConditionName,
  EquipmentAnimation,
  EquipmentType,
  HoldableSlotType,
  MonsterType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "@speed-dungeon/common";
import { SkeletalAnimationManager } from "../base/scene-entity-animation-manager/skeletal-animation-manager";
import { ManagedAnimationOptions } from "../base/scene-entity-animation-manager";
import { CombatantSceneEntity } from ".";

export class CombatantSceneEntityAnimationControls {
  constructor(
    private sceneEntity: CombatantSceneEntity,
    private combatant: Combatant,
    private skeletalAnimationManager: SkeletalAnimationManager
  ) {}

  isIdling() {
    const currentAnimationName = this.skeletalAnimationManager.playing?.getName();

    const idleAnimationStringNames = [
      SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleUnarmed],
      SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleMainHand],
      SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleDualWield],
      SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleBow],
      SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleTwoHand],
    ];

    if (currentAnimationName === undefined) return false;
    return idleAnimationStringNames.includes(currentAnimationName);
  }

  getIdleAnimationName() {
    const { combatantProperties } = this.combatant;
    const { monsterType } = this.combatant.combatantProperties;
    const isNonHumanoidMonster =
      monsterType !== null &&
      monsterType !== MonsterType.Cultist &&
      monsterType !== MonsterType.FireMage;

    if (isNonHumanoidMonster) {
      const { conditionManager } = this.combatant.combatantProperties;
      if (conditionManager.hasConditionName(CombatantConditionName.Flying)) {
        return SkeletalAnimationName.IdleFlying;
      }
      return SkeletalAnimationName.IdleUnarmed;
    }

    const { equipment } = combatantProperties;
    const offHandOption = equipment.getEquippedHoldable(HoldableSlotType.OffHand);
    const offhandType = offHandOption?.equipmentBaseItemProperties.equipmentType;
    const mainHandOption = equipment.getEquippedHoldable(HoldableSlotType.MainHand);
    const mainHandType = mainHandOption?.equipmentBaseItemProperties.equipmentType;
    const mhIsBroken = mainHandOption && mainHandOption.isBroken();
    const ohIsBroken = offHandOption && offHandOption.isBroken();

    if (mainHandType === EquipmentType.TwoHandedRangedWeapon && !mhIsBroken) {
      return SkeletalAnimationName.IdleBow;
    }
    if (mainHandType === EquipmentType.TwoHandedMeleeWeapon && !mhIsBroken) {
      return SkeletalAnimationName.IdleTwoHand;
    }
    if (offhandType !== undefined && offhandType !== EquipmentType.Shield && !ohIsBroken) {
      return SkeletalAnimationName.IdleDualWield;
    }
    if (mainHandType !== undefined && !mhIsBroken) {
      return SkeletalAnimationName.IdleMainHand;
    }
    return SkeletalAnimationName.IdleUnarmed;
  }

  startIdleAnimation(transitionMs: number, options?: ManagedAnimationOptions) {
    if (this.combatant.combatantProperties.isDead()) {
      return;
    }

    try {
      const idleName = this.getIdleAnimationName();

      const currentAnimationName = this.skeletalAnimationManager.playing?.getName();
      if (currentAnimationName === SKELETAL_ANIMATION_NAME_STRINGS[idleName]) {
        return console.info("was already idling");
      }

      this.skeletalAnimationManager.startAnimationWithTransition(idleName, transitionMs, {
        ...options,
        shouldLoop: true,
      });
    } catch (error) {
      console.info(
        "error attempting to start idle animation - this may be caused when asynchronously scheduling an animation change which triggers after a battle has ended",
        error
      );
    }
  }

  startHitRecoveryAnimation(wasBlocked: boolean, isCrit?: boolean) {
    const hasCritRecoveryAnimation = this.skeletalAnimationManager.getAnimationGroupByName(
      SkeletalAnimationName.CritRecovery
    );

    let animationName = SkeletalAnimationName.HitRecovery;
    if (isCrit && hasCritRecoveryAnimation) {
      animationName = SkeletalAnimationName.CritRecovery;
    }
    if (wasBlocked) {
      animationName = SkeletalAnimationName.Block;
    }

    // checking for isIdling is a simple way to avoid interrupting their return home when
    // they are hit midway through an action, which would cause their turn to never end
    // on the client
    const isIdling = this.isIdling();

    if (!isIdling) {
      return;
    }

    this.skeletalAnimationManager.startAnimationWithTransition(animationName, 0, {
      onComplete: () => {
        const wasRevived = false;

        if (wasRevived) {
          // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
        } else {
          try {
            this.startIdleAnimation(500);
          } catch (_error) {
            console.info("couldn't idle, maybe combatant was removed already");
          }
        }
      },
    });
  }

  startEquipmentAnimations(equipmentAnimations: EquipmentAnimation[]) {
    for (const equipmentAnimation of equipmentAnimations) {
      const { slot, animation } = equipmentAnimation;

      const equipmentModel = this.sceneEntity.equipmentManager.getEquipmentModelInSlot(slot);

      if (!equipmentModel) {
        return console.error("couldn't find equipment");
      }
      if (animation.name.type !== AnimationType.Skeletal) {
        return console.error("not skeletal");
      }

      equipmentModel.skeletalAnimationManager.startAnimationWithTransition(
        animation.name.name,
        animation.timing.type === AnimationTimingType.Timed ? animation.timing.duration : 0,
        {}
      );
    }
  }

  startDeathAnimation() {
    this.skeletalAnimationManager.startAnimationWithTransition(SkeletalAnimationName.DeathBack, 0, {
      onComplete: () => {
        this.skeletalAnimationManager.locked = true;
        try {
          // @TODO
          // // in case it was removed on death like a web/net would be
          // const wasRemoved = // check if still exists in game state
          // this.world.modelManager.synchronizeCombatantModels();
        } catch {
          console.info(
            "couldn't do death animation onComplete, maybe the combatant was already removed"
          );
        }
      },
    });
  }
}
