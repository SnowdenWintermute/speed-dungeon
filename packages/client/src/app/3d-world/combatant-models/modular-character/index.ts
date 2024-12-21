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
  CombatantClass,
  DEFAULT_HITBOX_RADIUS_FALLBACK,
  ERROR_MESSAGES,
  Equipment,
  HoldableSlotType,
  WearableSlotType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { MONSTER_SCALING_SIZES } from "../monster-scaling-sizes";
import cloneDeep from "lodash.clonedeep";
import { AnimationManager } from "../animation-manager";
import { ModelActionManager } from "../model-action-manager";
import setUpDebugMeshes from "./set-up-debug-meshes";
import { ANIMATION_NAMES } from "../animation-manager/animation-names";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { handleHotswapSlotChanged } from "./handle-hotswap-slot-changed";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { HighlightManager } from "./highlight-manager";

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
  modelActionManager: ModelActionManager = new ModelActionManager(this);
  animationManager: AnimationManager;
  highlightManager: HighlightManager = new HighlightManager(this);
  debugMeshes: {
    // directionLine: Mesh;
    homeLocationMesh: Mesh;
    // homeLocationDirectionLine: Mesh;
  } | null = null;

  constructor(
    public entityId: string,
    public world: GameWorld,
    public monsterType: null | MonsterType,
    public combatantClass: CombatantClass,
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

    this.rootMesh.position.x = 0;
    this.rootMesh.position.y = 0;
    this.rootMesh.position.z = 0;

    this.rootMesh.setParent(this.rootTransformNode);

    this.rootTransformNode.rotate(Vector3.Up(), startRotation);
    this.rootTransformNode.position = startPosition;

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = {
      position: cloneDeep(this.rootTransformNode.position),
      rotation: cloneDeep(this.rootTransformNode.rotationQuaternion!),
    };

    // this.rootMesh.showBoundingBox = true;
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

  async unequipHoldableModel(entityId: string) {
    const toDispose = this.equipment.holdables[entityId];
    if (!toDispose) return;
    disposeAsyncLoadedScene(toDispose, this.world.scene);
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

  handleHotswapSlotChanged = handleHotswapSlotChanged;
}
