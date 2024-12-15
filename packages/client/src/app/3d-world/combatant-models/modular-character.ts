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
} from "../utils";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import { GameWorld } from "../game-world";
import {
  DEFAULT_HITBOX_RADIUS_FALLBACK,
  ERROR_MESSAGES,
  EquipmentSlot,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { MONSTER_SCALING_SIZES } from "./monster-scaling-sizes";
import cloneDeep from "lodash.clonedeep";
import { AnimationManager } from "./animation-manager";
import { ModelActionManager } from "./model-action-manager";
import setUpDebugMeshes from "./set-up-debug-meshes";
import { ANIMATION_NAMES } from "./animation-manager/animation-names";
import attachEquipmentModelToSkeleton from "./attach-equipment-model-to-skeleton";
import { spawnItemModel } from "./spawn-item-models";

export class ModularCharacter {
  rootMesh: AbstractMesh;
  rootTransformNode: TransformNode;
  parts: Record<ModularCharacterPartCategory, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPartCategory.Head]: null,
    [ModularCharacterPartCategory.Torso]: null,
    [ModularCharacterPartCategory.Legs]: null,
    [ModularCharacterPartCategory.Full]: null,
  };
  equipment: Record<EquipmentSlot, null | ISceneLoaderAsyncResult> = {
    [EquipmentSlot.Head]: null,
    [EquipmentSlot.Body]: null,
    [EquipmentSlot.MainHand]: null,
    [EquipmentSlot.OffHand]: null,
    [EquipmentSlot.RingL]: null,
    [EquipmentSlot.RingR]: null,
    [EquipmentSlot.Amulet]: null,
  };
  hitboxRadius: number = DEFAULT_HITBOX_RADIUS_FALLBACK;
  homeLocation: {
    position: Vector3;
    rotation: Quaternion;
  };
  isInMeleeRangeOfTarget: boolean = false;
  modelActionManager: ModelActionManager = new ModelActionManager(this);
  animationManager: AnimationManager;
  debugMeshes: {
    // directionLine: Mesh;
    homeLocationMesh: Mesh;
    // homeLocationDirectionLine: Mesh;
  } | null = null;

  constructor(
    public entityId: string,
    public world: GameWorld,
    public monsterType: null | MonsterType,
    public skeleton: ISceneLoaderAsyncResult,
    public modelDomPositionElement: HTMLDivElement | null,
    startPosition: Vector3 = Vector3.Zero(),
    startRotation: number = 0,
    modelCorrectionRotation: number = 0
  ) {
    this.animationManager = new AnimationManager(this);
    this.animationManager.startAnimationWithTransition(ANIMATION_NAMES.IDLE, 0);

    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();
    const rootMesh = skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    if (monsterType !== null) {
      rootMesh.scaling = Vector3.One().scale(MONSTER_SCALING_SIZES[monsterType]);
    }

    this.rootTransformNode = new TransformNode(`${entityId}-root-transform-node`);
    this.rootMesh = rootMesh;
    this.rootMesh.rotate(Vector3.Up(), modelCorrectionRotation); // fix inconsistent blender export rotation

    this.rootMesh.setParent(this.rootTransformNode);

    this.rootTransformNode.rotate(Vector3.Up(), startRotation);
    this.rootTransformNode.position = startPosition;

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = {
      position: cloneDeep(this.rootTransformNode.position),
      rotation: cloneDeep(this.rootTransformNode.rotationQuaternion!),
    };

    // this.setUpDebugMeshes();

    // this.setShowBones();
  }

  setUpDebugMeshes = setUpDebugMeshes;

  updateDomRefPosition() {
    const boundingBox = getClientRectFromMesh(this.world.scene, this.world.canvas, this.rootMesh);
    if (this.modelDomPositionElement) {
      this.modelDomPositionElement.setAttribute(
        "style",
        `height: ${boundingBox.height}px;
         width: ${boundingBox.width}px;
         top: ${boundingBox.top}px;
         left: ${boundingBox.left}px;`
      );
    }
  }

  updateBoundingBox() {
    let minimum: null | Vector3 = null;
    let maximum: null | Vector3 = null;

    for (const part of Object.values(this.parts)) {
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
    if (minimum === null || maximum === null) return console.log("no mesh bounding info found");
    this.rootMesh.setBoundingInfo(
      new BoundingInfo(minimum, maximum, this.rootMesh.getWorldMatrix())
    );
  }

  async attachPart(partCategory: ModularCharacterPartCategory, partPath: string) {
    const part = await importMesh(partPath, this.world.scene);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");
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

  async unequipItem(slot: EquipmentSlot) {
    if (!this.equipment[slot]) return;
    disposeAsyncLoadedScene(this.equipment[slot], this.world.scene);
    delete this.equipment[slot];
  }

  async equipItem(item: Item, slot: EquipmentSlot) {
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) return;

    const equipmentModelResult = await spawnItemModel(
      item,
      this.world.scene,
      this.world.defaultMaterials
    );
    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);
    this.equipment[slot] = equipmentModelResult;

    attachEquipmentModelToSkeleton(
      this,
      equipmentModelResult,
      slot,
      item.itemProperties.equipmentProperties
    );
  }

  removePart(partCategory: ModularCharacterPartCategory) {
    disposeAsyncLoadedScene(this.parts[partCategory], this.world.scene);
    this.parts[partCategory] = null;
  }

  setShowBones() {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    if (!this.skeleton.meshes[0]) return;
    const skeletonRootBone = getChildMeshByName(this.skeleton.meshes[0], "Root");
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }
}
