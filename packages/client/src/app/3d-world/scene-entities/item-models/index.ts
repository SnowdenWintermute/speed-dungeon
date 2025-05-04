import {
  AbstractMesh,
  Color4,
  AssetContainer,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { getChildMeshByName, paintCubesOnNodes } from "../../utils";
import { GameWorld } from "../../game-world";
import {
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { SkeletalAnimationManager } from "../model-animation-managers/skeletal-animation-manager";
import { CosmeticEffectManager } from "../cosmetic-effect-manager";
import { ManagedAnimationOptions } from "../model-animation-managers";
import { BONE_NAMES, BoneName } from "../character-models/skeleton-structure-variables";

export class ItemModel {
  rootMesh: AbstractMesh;
  rootTransformNode: TransformNode;
  animationManager: SkeletalAnimationManager;
  cosmeticEffectManager = new CosmeticEffectManager();
  public visibility: number = 0;

  constructor(
    public entityId: string,
    public skeleton: AssetContainer,
    public modelDomPositionElement: HTMLDivElement | null,
    public debugElement: HTMLDivElement | null,
    homePosition: Vector3,
    homeRotation: Quaternion
  ) {
    this.animationManager = new SkeletalAnimationManager(this);

    // get rid of the placeholder mesh (usually a simple quad or tri) which
    // must be included in order for babylon to recognize the loaded asset as a skeleton
    while (skeleton.meshes.length > 1) {
      skeleton.meshes.pop()!.dispose(false, true);
    }

    const rootMesh = this.skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    this.rootTransformNode = new TransformNode(`${this.entityId}-root-transform-node`);
    this.rootTransformNode.rotationQuaternion = plainToInstance(Quaternion, homeRotation);
    this.rootTransformNode.position = plainToInstance(Vector3, homePosition);

    this.rootMesh = rootMesh;
    this.rootMesh.setParent(this.rootTransformNode);
    this.rootMesh.position.copyFrom(Vector3.Zero());

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);

    // this.setShowBones();
  }

  setVisibility(value: number) {
    this.visibility = value;
  }

  startIdleAnimation(transitionMs: number, options?: ManagedAnimationOptions) {
    // const idleName = this.getIdleAnimationName();
    // this.animationManager.startAnimationWithTransition(idleName, transitionMs, {
    //   ...options,
    //   shouldLoop: true,
    // });
  }

  getIdleAnimationName() {
    // if (
    //   this.monsterType !== null &&
    //   this.monsterType !== MonsterType.Cultist &&
    //   this.monsterType !== MonsterType.FireMage
    // )
    //   return SkeletalAnimationName.IdleUnarmed;
    // const combatant = this.getCombatant();
    // const { combatantProperties } = combatant;
    // const offHandOption = CombatantEquipment.getEquippedHoldable(
    //   combatantProperties,
    //   HoldableSlotType.OffHand
    // );
    // const offhandType = offHandOption?.equipmentBaseItemProperties.equipmentType;
    // const mainHandOption = CombatantEquipment.getEquippedHoldable(
    //   combatantProperties,
    //   HoldableSlotType.MainHand
    // );
    // const mainHandType = mainHandOption?.equipmentBaseItemProperties.equipmentType;
    // const mhIsBroken = mainHandOption && Equipment.isBroken(mainHandOption);
    // const ohIsBroken = offHandOption && Equipment.isBroken(offHandOption);
    // if (mainHandType === EquipmentType.TwoHandedRangedWeapon && !mhIsBroken)
    //   return SkeletalAnimationName.IdleBow;
    // if (mainHandType === EquipmentType.TwoHandedMeleeWeapon && !mhIsBroken)
    //   return SkeletalAnimationName.IdleTwoHand;
    // if (offhandType !== undefined && offhandType !== EquipmentType.Shield && !ohIsBroken)
    //   return SkeletalAnimationName.IdleDualWield;
    // if (mainHandType !== undefined && !mhIsBroken) return SkeletalAnimationName.IdleMainHand;
    // return SkeletalAnimationName.IdleUnarmed;
  }

  getBoundingInfo() {
    const boundingInfo = this.rootMesh.getBoundingInfo();
    return boundingInfo;
  }

  isIdling() {
    const currentAnimationName = this.animationManager.playing?.getName();

    return (
      currentAnimationName === SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleUnarmed] ||
      currentAnimationName ===
        SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleMainHand] ||
      currentAnimationName ===
        SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleDualWield] ||
      currentAnimationName === SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleBow] ||
      currentAnimationName === SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.IdleTwoHand]
    );
  }

  setShowBones(world: GameWorld) {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    if (!this.skeleton.meshes[0]) return;
    const skeletonRootBone = getChildMeshByName(
      this.skeleton.meshes[0],
      BONE_NAMES[BoneName.Armature]
    );
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, world.scene);
  }
}
