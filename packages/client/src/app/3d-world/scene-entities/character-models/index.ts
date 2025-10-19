import {
  BoundingInfo,
  Color4,
  AssetContainer,
  Mesh,
  Quaternion,
  Vector3,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import { getChildMeshByName, getClientRectFromMesh, paintCubesOnNodes } from "../../utils";
import { GameWorld } from "../../game-world";
import {
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
  CombatantClass,
  ERROR_MESSAGES,
  Equipment,
  HoldableSlotType,
  iterateNumericEnumKeyedRecord,
  EquipmentType,
  CombatantBaseChildTransformNodeName,
  NormalizedPercentage,
  CombatantProperties,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { setUpDebugMeshes, despawnDebugMeshes } from "./set-up-debug-meshes";
import { HighlightManager } from "./highlight-manager";
import { plainToInstance } from "class-transformer";
import { ManagedAnimationOptions } from "../model-animation-managers";
import { SceneEntity } from "..";
import { BONE_NAMES, BoneName } from "./skeleton-structure-variables";
import { EquipmentModelManager } from "./equipment-model-manager";
import { ModularCharacterPartsModelManager } from "./modular-character-parts-model-manager";
import { TargetIndicatorBillboardManager } from "./target-indicator-manager";
import { AppStore } from "@/mobx-stores/app-store";

export class CharacterModel extends SceneEntity {
  childTransformNodes: Partial<Record<CombatantBaseChildTransformNodeName, TransformNode>> = {};
  homeLocation: {
    position: Vector3;
    rotation: Quaternion;
  };

  modularCharacterPartsManager = new ModularCharacterPartsModelManager(this);
  equipmentModelManager = new EquipmentModelManager(this);
  highlightManager: HighlightManager = new HighlightManager(this);
  targetingIndicatorBillboardManager: TargetIndicatorBillboardManager;

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

    this.targetingIndicatorBillboardManager = new TargetIndicatorBillboardManager(
      world.camera,
      this.rootMesh
    );
    // this.initChildTransformNodes();

    // for (const [nodeName, transformNode] of iterateNumericEnumKeyedRecord(
    //   this.childTransformNodes
    // )) {
    //   const markerMesh = MeshBuilder.CreateBox("", { size: 0.1 });
    //   markerMesh.setParent(transformNode);
    //   markerMesh.setPositionWithLocalVector(Vector3.Zero());
    // }
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

    const headNode = SceneEntity.createTransformNodeChildOfBone(
      this.rootMesh,
      `${this.entityId}-head`,
      "DEF-head"
    );
    this.childTransformNodes[CombatantBaseChildTransformNodeName.Head] = headNode;

    if (!headNode) throw new Error("no head node");

    this.childTransformNodes[CombatantBaseChildTransformNodeName.EntityRoot] =
      this.rootTransformNode;

    const hitboxCenterTransformNode = new TransformNode(`${this.entityId}-hitbox-center`);
    const hitboxCenter = this.getBoundingInfo().boundingBox.center;

    hitboxCenterTransformNode.setParent(this.rootTransformNode);
    hitboxCenterTransformNode.position = hitboxCenter.clone();

    this.childTransformNodes[CombatantBaseChildTransformNodeName.HitboxCenter] =
      hitboxCenterTransformNode;
  }

  customCleanup(): void {
    if (this.debugMeshes) for (const mesh of Object.values(this.debugMeshes)) mesh.dispose();
    this.equipmentModelManager.cleanup();
    this.modularCharacterPartsManager.cleanup();
  }

  getSkeletonRoot() {
    if (!this.assetContainer.meshes[0])
      throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    return this.assetContainer.meshes[0];
  }

  setVisibility(value: NormalizedPercentage) {
    this.visibility = value;

    this.equipmentModelManager.setVisibilityForShownHotswapSlots(this.visibility);
    this.modularCharacterPartsManager.setVisibility(this.visibility);
  }

  setHomeRotation(rotation: Quaternion) {
    this.homeLocation.rotation.copyFrom(plainToInstance(Quaternion, rotation));
  }

  setHomeLocation(position: Vector3) {
    this.rootTransformNode.position.copyFrom(position);
    this.homeLocation.position = cloneDeep(this.rootTransformNode.position);
  }

  startIdleAnimation(transitionMs: number, options?: ManagedAnimationOptions) {
    const combatant = this.getCombatant();
    if (CombatantProperties.isDead(combatant.combatantProperties)) return;
    try {
      const idleName = this.getIdleAnimationName();

      const currentAnimationName = this.skeletalAnimationManager.playing?.getName();
      if (currentAnimationName === SKELETAL_ANIMATION_NAME_STRINGS[idleName])
        return console.info("was already idling");

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

  getCombatant() {
    // first check in their party if in game
    let combatantOption = AppStore.get().gameStore.getCombatantOption(this.entityId);

    // if not there, it could be in saved characters
    if (combatantOption === undefined) {
      combatantOption = AppStore.get().lobbyStore.getSavedCharacterOption(this.entityId);
    }

    if (combatantOption === undefined) {
      throw new Error("no combatant could be found for this character model");
    }

    return combatantOption;
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
    const { equipment } = combatantProperties;
    const offHandOption = equipment.getEquippedHoldable(HoldableSlotType.OffHand);
    const offhandType = offHandOption?.equipmentBaseItemProperties.equipmentType;
    const mainHandOption = equipment.getEquippedHoldable(HoldableSlotType.MainHand);
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

    for (const [_category, part] of iterateNumericEnumKeyedRecord(
      this.modularCharacterPartsManager.parts
    )) {
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

  setShowBones() {
    const transparentMaterial = new StandardMaterial("");
    transparentMaterial.alpha = 0.3;
    for (const [category, assetContainer] of iterateNumericEnumKeyedRecord(
      this.modularCharacterPartsManager.parts
    )) {
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
}
