import {
  BoundingInfo,
  Color4,
  AssetContainer,
  Mesh,
  Quaternion,
  Vector3,
  StandardMaterial,
  TransformNode,
  MeshBuilder,
} from "@babylonjs/core";
import {
  disposeAsyncLoadedScene,
  getChildMeshByName,
  getClientRectFromMesh,
  getTransformNodeByName,
  importMesh,
  paintCubesOnNodes,
} from "../../utils";
import { GameWorld } from "../../game-world";
import {
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
  CombatantClass,
  ERROR_MESSAGES,
  Equipment,
  HoldableSlotType,
  WearableSlotType,
  iterateNumericEnumKeyedRecord,
  CombatantEquipment,
  EquipmentType,
  CombatantBaseChildTransformNodeName,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { setUpDebugMeshes, despawnDebugMeshes } from "./set-up-debug-meshes";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { handleHotswapSlotChanged } from "./handle-hotswap-slot-changed";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { HighlightManager } from "./highlight-manager";
import { useGameStore } from "@/stores/game-store";
import { plainToInstance } from "class-transformer";
import { useLobbyStore } from "@/stores/lobby-store";
import { ManagedAnimationOptions } from "../model-animation-managers";
import { CharacterModelPartCategory } from "./modular-character-parts";
import { SceneEntity } from "..";
import { ConsumableModel, EquipmentModel } from "../item-models";
import { BONE_NAMES, BoneName } from "./skeleton-structure-variables";

export class CharacterModel extends SceneEntity {
  childTransformNodes: Partial<Record<CombatantBaseChildTransformNodeName, TransformNode>> = {};
  parts: Record<CharacterModelPartCategory, null | AssetContainer> = {
    [CharacterModelPartCategory.Head]: null,
    [CharacterModelPartCategory.Torso]: null,
    [CharacterModelPartCategory.Legs]: null,
    [CharacterModelPartCategory.Full]: null,
  };
  equipment: {
    wearables: Record<WearableSlotType, null | EquipmentModel>;
    holdables: Partial<Record<HoldableSlotType, null | EquipmentModel>>;
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
  homeLocation: {
    position: Vector3;
    rotation: Quaternion;
  };
  highlightManager: HighlightManager = new HighlightManager(this);
  debugMeshes: Mesh[] | null = null;

  constructor(
    public entityId: string,
    public world: GameWorld,
    public monsterType: null | MonsterType,
    public isPlayerControlled: boolean,
    public combatantClass: CombatantClass,
    skeletonAssetContainer: AssetContainer,
    public modelDomPositionElement: HTMLDivElement | null,
    public debugElement: HTMLDivElement | null,
    homePosition: Vector3,
    homeRotation: Quaternion
  ) {
    super(entityId, skeletonAssetContainer, homePosition, homeRotation);

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = {
      position: cloneDeep(this.rootTransformNode.position),
      rotation: cloneDeep(rotation),
    };

    this.initChildTransformNodes();

    for (const [nodeName, transformNode] of iterateNumericEnumKeyedRecord(
      this.childTransformNodes
    )) {
      const markerMesh = MeshBuilder.CreateBox("", { size: 0.1 });
      markerMesh.setParent(transformNode);
      markerMesh.setPositionWithLocalVector(Vector3.Zero());
    }
    // this.setUpDebugMeshes();
    // this.setShowBones();
  }

  initRootMesh(assetContainer: AssetContainer) {
    // get rid of the placeholder mesh (usually a simple quad or tri) which
    // must be included in order for babylon to recognize the loaded asset as a skeleton
    while (assetContainer.meshes.length > 1) {
      assetContainer.meshes.pop()!.dispose(false, true);
    }

    const rootMesh = assetContainer.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    return rootMesh;
  }

  initChildTransformNodes(): void {
    const mainHandEquipmentNode = SceneEntity.createTransformNodeChildOfBone(
      this.rootMesh,
      `${this.entityId}-mh-equipment`,
      "Equipment.R"
    );
    this.childTransformNodes[CombatantBaseChildTransformNodeName.MainHandEquipment] =
      mainHandEquipmentNode;

    const offHandEquipmentNode = SceneEntity.createTransformNodeChildOfBone(
      this.rootMesh,
      `${this.entityId}-oh-equipment`,
      "Equipment.L"
    );
    this.childTransformNodes[CombatantBaseChildTransformNodeName.OffhandEquipment] =
      offHandEquipmentNode;

    this.childTransformNodes[CombatantBaseChildTransformNodeName.EntityRoot] =
      this.rootTransformNode;

    const hitboxCenterTransformNode = new TransformNode(`${this.entityId}-hitbox-center`);
    const hitboxCenter = this.getBoundingInfo().boundingBox.center;
    hitboxCenterTransformNode.position = hitboxCenter.clone();
    hitboxCenterTransformNode.setParent(this.rootTransformNode);
    this.childTransformNodes[CombatantBaseChildTransformNodeName.HitboxCenter] =
      hitboxCenterTransformNode;
  }

  customCleanup(): void {
    if (this.debugMeshes) for (const mesh of Object.values(this.debugMeshes)) mesh.dispose();
    for (const part of Object.values(this.parts)) part?.dispose();

    for (const [_slotType, model] of iterateNumericEnumKeyedRecord(this.equipment.wearables))
      model?.cleanup({ softCleanup: false });

    for (const model of Object.values(this.equipment.holdables))
      model?.cleanup({ softCleanup: false });
  }

  getSkeletonRoot() {
    if (!this.assetContainer.meshes[0])
      throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    return this.assetContainer.meshes[0];
  }

  setVisibility(value: number) {
    this.visibility = value;

    for (const [_partCategory, scene] of iterateNumericEnumKeyedRecord(this.parts)) {
      scene?.meshes.forEach((mesh) => {
        mesh.visibility = this.visibility;
      });
    }
    for (const holdable of Object.values(this.equipment.holdables)) {
      holdable?.assetContainer.meshes.forEach((mesh) => (mesh.visibility = this.visibility));
    }
    for (const wearable of Object.values(this.equipment.wearables)) {
      wearable?.assetContainer.meshes.forEach((mesh) => (mesh.visibility = this.visibility));
    }
  }

  setHomeRotation(rotation: Quaternion) {
    this.homeLocation.rotation.copyFrom(plainToInstance(Quaternion, rotation));
  }

  setHomeLocation(position: Vector3) {
    this.rootTransformNode.position.copyFrom(position);
    this.homeLocation.position = cloneDeep(this.rootTransformNode.position);
  }

  startIdleAnimation(transitionMs: number, options?: ManagedAnimationOptions) {
    const idleName = this.getIdleAnimationName();

    this.skeletalAnimationManager.startAnimationWithTransition(idleName, transitionMs, {
      ...options,
      shouldLoop: true,
    });
  }

  getCombatant() {
    let combatantResult = useGameStore.getState().getCombatant(this.entityId);
    if (combatantResult instanceof Error) {
      for (const [slotNumberString, combatantOption] of Object.entries(
        useLobbyStore.getState().savedCharacters
      )) {
        if (combatantOption?.entityProperties.id === this.entityId)
          combatantResult = combatantOption;
      }
    }
    if (combatantResult instanceof Error) throw combatantResult;
    return combatantResult;
  }

  getIdleAnimationName() {
    if (
      this.monsterType !== null &&
      this.monsterType !== MonsterType.Cultist &&
      this.monsterType !== MonsterType.FireMage
    )
      return SkeletalAnimationName.IdleUnarmed;
    const combatant = this.getCombatant();

    const { combatantProperties } = combatant;
    const offHandOption = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.OffHand
    );
    const offhandType = offHandOption?.equipmentBaseItemProperties.equipmentType;
    const mainHandOption = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.MainHand
    );
    const mainHandType = mainHandOption?.equipmentBaseItemProperties.equipmentType;
    const mhIsBroken = mainHandOption && Equipment.isBroken(mainHandOption);
    const ohIsBroken = offHandOption && Equipment.isBroken(offHandOption);

    if (mainHandType === EquipmentType.TwoHandedRangedWeapon && !mhIsBroken)
      return SkeletalAnimationName.IdleBow;
    if (mainHandType === EquipmentType.TwoHandedMeleeWeapon && !mhIsBroken)
      return SkeletalAnimationName.IdleTwoHand;
    if (offhandType !== undefined && offhandType !== EquipmentType.Shield && !ohIsBroken)
      return SkeletalAnimationName.IdleDualWield;
    if (mainHandType !== undefined && !mhIsBroken) return SkeletalAnimationName.IdleMainHand;
    return SkeletalAnimationName.IdleUnarmed;
  }

  setUpDebugMeshes = setUpDebugMeshes;
  despawnDebugMeshes = despawnDebugMeshes;

  getBoundingInfo() {
    const boundingInfo = this.rootMesh.getBoundingInfo();
    return boundingInfo;
  }

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

  async attachPart(partCategory: CharacterModelPartCategory, partPath: string) {
    const part = await importMesh(partPath, this.world.scene);
    const parent = getTransformNodeByName(this.assetContainer, BONE_NAMES[BoneName.Armature]);

    if (!this.assetContainer.skeletons[0])
      return new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    for (const mesh of part.meshes) {
      // attach part
      if (mesh.skeleton) mesh.skeleton = this.assetContainer.skeletons[0];
      mesh.visibility = this.visibility;

      mesh.parent = parent!;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;

    this.updateBoundingBox();

    return part;
  }

  async unequipHoldableModel(slot: HoldableSlotType) {
    const toDispose = this.equipment.holdables[slot];
    if (!toDispose) return;
    toDispose.cleanup({ softCleanup: false });

    if (this.isIdling()) {
      this.startIdleAnimation(500);
    } else console.log("wasn't idling when unequipping");
  }

  isIdling() {
    const currentAnimationName = this.skeletalAnimationManager.playing?.getName();

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
    if (equipmentModelResult instanceof ConsumableModel)
      return new Error("unexpected item model type");

    equipmentModelResult.assetContainer.meshes.forEach(
      (mesh) => (mesh.visibility = this.visibility)
    );

    this.equipment.holdables[slot] = equipmentModelResult;

    if (holstered)
      attachHoldableModelToHolsteredPosition(this, equipmentModelResult, slot, equipment);
    else attachHoldableModelToSkeleton(this, equipmentModelResult, slot, equipment);
  }

  removePart(partCategory: CharacterModelPartCategory) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  setShowBones() {
    const transparentMaterial = new StandardMaterial("");
    transparentMaterial.alpha = 0.3;
    for (const [category, assetContainer] of iterateNumericEnumKeyedRecord(this.parts)) {
      if (!assetContainer) continue;
      for (const mesh of assetContainer.meshes) {
        for (const child of mesh.getChildMeshes()) mesh.material = transparentMaterial;
      }
    }

    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(
      this.getSkeletonRoot(),
      BONE_NAMES[BoneName.Armature]
    );
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }

  handleHotswapSlotChanged = handleHotswapSlotChanged;
}
