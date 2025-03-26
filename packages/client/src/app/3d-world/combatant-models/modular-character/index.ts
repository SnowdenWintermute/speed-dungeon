import {
  AbstractMesh,
  BoundingInfo,
  Color4,
  ISceneLoaderAsyncResult,
  Mesh,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import {
  disposeAsyncLoadedScene,
  getChildMeshByName,
  getClientRectFromMesh,
  getTransformNodeByName,
  importMesh,
  paintCubesOnNodes,
} from "../../utils";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import { GameWorld } from "../../game-world";
import {
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
  CombatantClass,
  DEFAULT_HITBOX_RADIUS_FALLBACK,
  ERROR_MESSAGES,
  Equipment,
  HoldableSlotType,
  WearableSlotType,
  iterateNumericEnumKeyedRecord,
  CombatantEquipment,
  EquipmentType,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { MONSTER_SCALING_SIZES } from "../monster-scaling-sizes";
import cloneDeep from "lodash.clonedeep";
import { setUpDebugMeshes, despawnDebugMeshes } from "./set-up-debug-meshes";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { handleHotswapSlotChanged } from "./handle-hotswap-slot-changed";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { HighlightManager } from "./highlight-manager";
import { ModelMovementManager } from "../../model-movement-manager";
import { SKELETON_ARMATURE_NAMES, SKELETON_STRUCTURE_TYPE } from "./skeleton-structure-variables";
import { SkeletalAnimationManager } from "../animation-manager/skeletal-animation-manager";
import { useGameStore } from "@/stores/game-store";

export class ModularCharacter {
  rootMesh: AbstractMesh;
  rootTransformNode: TransformNode;
  parts: Record<ModularCharacterPartCategory, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPartCategory.Head]: null,
    [ModularCharacterPartCategory.Torso]: null,
    [ModularCharacterPartCategory.Legs]: null,
    [ModularCharacterPartCategory.Full]: null,
  };
  equipment: {
    wearables: Record<
      WearableSlotType,
      null | { entityId: string; scene: ISceneLoaderAsyncResult }
    >;
    holdables: { [entityId: string]: ISceneLoaderAsyncResult };
  } = {
    wearables: {
      [WearableSlotType.Head]: null,
      [WearableSlotType.Body]: null,
      [WearableSlotType.RingL]: null,
      [WearableSlotType.RingR]: null,
      [WearableSlotType.Amulet]: null,
    },
    holdables: {},
  };
  hitboxRadius: number = DEFAULT_HITBOX_RADIUS_FALLBACK;
  homeLocation: {
    position: Vector3;
    rotation: Quaternion;
  };
  isInMeleeRangeOfTarget: boolean = false;
  movementManager: ModelMovementManager;
  animationManager: SkeletalAnimationManager;
  highlightManager: HighlightManager = new HighlightManager(this);
  debugMeshes: Mesh[] | null = null;

  constructor(
    public entityId: string,
    public world: GameWorld,
    public monsterType: null | MonsterType,
    public isPlayerControlled: boolean,
    public combatantClass: CombatantClass,
    public skeleton: ISceneLoaderAsyncResult,
    public modelDomPositionElement: HTMLDivElement | null,
    public debugElement: HTMLDivElement | null,
    startPosition: Vector3 = Vector3.Zero(),
    startRotation: number = 0
  ) {
    this.animationManager = new SkeletalAnimationManager(this);
    this.startIdleAnimation(0);

    // get rid of the placeholder mesh (usually a simple quad or tri) which
    // must be included in order for babylon to recognize the loaded asset as a skeleton
    while (skeleton.meshes.length > 1) {
      skeleton.meshes.pop()!.dispose(false, true);
    }

    const rootMesh = this.skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    if (this.monsterType !== null) {
      rootMesh.scaling = Vector3.One().scale(MONSTER_SCALING_SIZES[this.monsterType]);
    }
    this.rootTransformNode = new TransformNode(`${this.entityId}-root-transform-node`);
    this.rootTransformNode.rotationQuaternion = Quaternion.Identity();
    this.rootTransformNode.rotate(Vector3.Up(), startRotation);
    this.rootTransformNode.position.copyFrom(startPosition);
    this.movementManager = new ModelMovementManager(this.rootTransformNode);

    this.rootMesh = rootMesh;
    this.rootMesh.setParent(this.rootTransformNode);
    this.rootMesh.position.copyFrom(Vector3.Zero());

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = {
      position: cloneDeep(this.rootTransformNode.position),
      rotation: cloneDeep(rotation),
    };

    // this.setUpDebugMeshes();
    // this.setShowBones();
  }

  setHomeRotation(rotation: number) {
    this.rootTransformNode.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), rotation);
    this.homeLocation.rotation.copyFrom(this.rootTransformNode.rotationQuaternion);
  }

  setHomeLocation(position: Vector3) {
    this.rootTransformNode.position.copyFrom(position);

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = {
      position: cloneDeep(this.rootTransformNode.position),
      rotation: cloneDeep(rotation),
    };
  }

  startIdleAnimation(transitionMs: number) {
    console.log("getting idle name: ", this.getIdleAnimationName());
    this.animationManager.startAnimationWithTransition(this.getIdleAnimationName(), transitionMs);
  }

  getIdleAnimationName() {
    if (this.monsterType !== null) return SkeletalAnimationName.IdleUnarmed;
    const combatantResult = useGameStore.getState().getCombatant(this.entityId);
    if (combatantResult instanceof Error) throw combatantResult;
    const { combatantProperties } = combatantResult;
    const offhandType = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.OffHand
    )?.equipmentBaseItemProperties.equipmentType;
    const mainHandType = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.MainHand
    )?.equipmentBaseItemProperties.equipmentType;
    if (mainHandType === EquipmentType.TwoHandedRangedWeapon) return SkeletalAnimationName.IdleBow;
    if (mainHandType === EquipmentType.TwoHandedMeleeWeapon)
      return SkeletalAnimationName.IdleTwoHand;
    if (offhandType !== undefined && offhandType !== EquipmentType.Shield)
      return SkeletalAnimationName.IdleDualWield;
    if (mainHandType !== undefined) return SkeletalAnimationName.IdleMainHand;
    return SkeletalAnimationName.IdleUnarmed;
  }

  setUpDebugMeshes = setUpDebugMeshes;
  despawnDebugMeshes = despawnDebugMeshes;

  updateDomRefPosition() {
    const boundingBox = getClientRectFromMesh(this.world.scene, this.world.canvas, this.rootMesh);
    if (!this.modelDomPositionElement) return;
    this.modelDomPositionElement.setAttribute(
      "style",
      `height: ${boundingBox.height}px;
         width: ${boundingBox.width}px;
         top: ${boundingBox.top}px;
         left: ${boundingBox.left}px;`
    );
  }

  updateBoundingBox() {
    let minimum: null | Vector3 = null;
    let maximum: null | Vector3 = null;

    for (const [_category, part] of iterateNumericEnumKeyedRecord(this.parts)) {
      if (part === null) continue;
      for (const mesh of part.meshes) {
        // if (mesh.name === "__root__") continue;
        // Update root mesh bounding box
        mesh.refreshBoundingInfo({ applySkeleton: true, applyMorph: true });
        if (minimum === null) minimum = mesh.getBoundingInfo().minimum;
        if (maximum === null) maximum = mesh.getBoundingInfo().maximum;

        const partMeshBoundingInfo = mesh.getBoundingInfo();

        minimum = Vector3.Minimize(minimum, partMeshBoundingInfo.minimum);
        maximum = Vector3.Maximize(maximum, partMeshBoundingInfo.maximum);
      }
    }

    if (minimum === null || maximum === null) return console.error("no mesh bounding info found");
    this.rootMesh.setBoundingInfo(
      new BoundingInfo(minimum, maximum, this.rootMesh.getWorldMatrix())
    );
  }

  async attachPart(partCategory: ModularCharacterPartCategory, partPath: string) {
    const part = await importMesh(partPath, this.world.scene);
    const parent = getTransformNodeByName(
      this.skeleton,
      SKELETON_ARMATURE_NAMES[SKELETON_STRUCTURE_TYPE]
    );
    console.log("parent: ", parent);
    if (!this.skeleton.skeletons[0])
      return new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    for (const mesh of part.meshes) {
      // attach part
      if (mesh.skeleton) mesh.skeleton = this.skeleton.skeletons[0];

      mesh.parent = parent!;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;

    this.updateBoundingBox();

    return part;
  }

  async unequipHoldableModel(entityId: string) {
    console.log("unequip holdable model");
    const toDispose = this.equipment.holdables[entityId];
    if (!toDispose) return;
    disposeAsyncLoadedScene(toDispose);

    if (this.isIdling()) {
      console.log("unequipped and idling");
      this.startIdleAnimation(500);
    } else console.log("wasn't idling");
  }

  isIdling() {
    const currentAnimationName = this.animationManager.playing?.animationGroupOption?.name;

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

  async equipHoldableModel(equipment: Equipment, slot: HoldableSlotType, holstered?: boolean) {
    const equipmentModelResult = await spawnItemModel(
      equipment,
      this.world.scene,
      this.world.defaultMaterials,
      true
    );
    if (equipmentModelResult instanceof Error) {
      console.log("equipment model error: ", equipmentModelResult.message);
      return;
    }

    this.equipment.holdables[equipment.entityProperties.id] = equipmentModelResult;

    if (holstered)
      attachHoldableModelToHolsteredPosition(this, equipmentModelResult, slot, equipment);
    else attachHoldableModelToSkeleton(this, equipmentModelResult, slot, equipment);
  }

  removePart(partCategory: ModularCharacterPartCategory) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  setShowBones() {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    if (!this.skeleton.meshes[0]) return;
    const skeletonRootBone = getChildMeshByName(
      this.skeleton.meshes[0],
      SKELETON_ARMATURE_NAMES[SKELETON_STRUCTURE_TYPE]
    );
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }

  handleHotswapSlotChanged = handleHotswapSlotChanged;
}
