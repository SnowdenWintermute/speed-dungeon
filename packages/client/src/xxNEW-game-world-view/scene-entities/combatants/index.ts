import { AssetContainer, TransformNode, AbstractMesh } from "@babylonjs/core";
import {
  SkeletalAnimationName,
  ERROR_MESSAGES,
  CombatantBaseChildTransformNodeName,
  NormalizedPercentage,
  CombatantConditionName,
  Combatant,
  invariant,
} from "@speed-dungeon/common";
import { SceneEntity } from "../base";
import { CombatantSceneEntityDebug } from "./debug";
import { CombatantSceneEntityAnimationControls } from "./animation-controls";
import { CombatantSceneEntityPositionControls } from "./position-controls";
import { CombatantSceneEntityBounding } from "./bounding";
import { CombatantSceneEntityModularPartsManager } from "./modular-parts-manager/modular-parts-manager";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { getClientRectFromMesh } from "@/xxNEW-game-world-view/utils";
import { ClientApplication } from "@/client-application";
import { HighlightManager } from "./highlight-manager/index";
import { CombatantSceneEntityEquipmentManager } from "./equipment-manager";

export class CombatantSceneEntity extends SceneEntity {
  readonly childTransformNodes: Partial<
    Record<CombatantBaseChildTransformNodeName, TransformNode>
  > = {};
  readonly debugView: CombatantSceneEntityDebug;
  readonly animationControls: CombatantSceneEntityAnimationControls;
  readonly positionControls: CombatantSceneEntityPositionControls;
  readonly bounding: CombatantSceneEntityBounding;
  readonly modularPartsManager: CombatantSceneEntityModularPartsManager;

  readonly equipmentManager: CombatantSceneEntityEquipmentManager;
  readonly highlightManager: HighlightManager;
  targetingIndicatorBillboardManager: TargetIndicatorBillboardManager;

  constructor(
    private world: GameWorldView,
    private clientApplication: ClientApplication,
    private readonly _combatant: Combatant,
    skeletonAssetContainer: AssetContainer,
    public modelDomPositionElement: HTMLDivElement | null,
    public debugElement: HTMLDivElement | null
  ) {
    const { transformProperties } = _combatant.combatantProperties;
    const homePosition = transformProperties.getHomePosition();
    const homeRotation = transformProperties.homeRotation;
    super(_combatant.getEntityId(), skeletonAssetContainer, homePosition, homeRotation);

    const rotation = this.rootTransformNode.rotationQuaternion;
    if (!rotation) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    }

    this.targetingIndicatorBillboardManager = new TargetIndicatorBillboardManager(
      world.camera,
      this.rootMesh
    );
    this.animationControls = new CombatantSceneEntityAnimationControls(
      _combatant,
      this.skeletalAnimationManager
    );
    this.positionControls = new CombatantSceneEntityPositionControls(
      _combatant,
      this.rootTransformNode
    );
    this.debugView = new CombatantSceneEntityDebug(world.scene, this);
    this.modularPartsManager = new CombatantSceneEntityModularPartsManager(
      world.clientApplication.assetService,
      this
    );

    this.bounding = new CombatantSceneEntityBounding(this.modularPartsManager, this.rootMesh);
    this.equipmentManager = new CombatantSceneEntityEquipmentManager(
      this,
      world.itemSceneEntityFactory
    );

    this.highlightManager = new HighlightManager(world.scene, clientApplication, this);

    // this.initChildTransformNodes();
  }

  initRootMesh(assetContainer: AssetContainer) {
    this.removeSkinnedPlaceholderMesh(assetContainer);
    const rootMesh = assetContainer.meshes[0];
    if (rootMesh === undefined) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    }

    return rootMesh;
  }

  // get rid of the placeholder mesh (usually a simple quad or tri) which
  // must be included in order for babylon to recognize the loaded asset as a skeleton
  private removeSkinnedPlaceholderMesh(assetContainer: AssetContainer) {
    while (assetContainer.meshes.length > 1) {
      const expected = assetContainer.meshes.pop();
      invariant(expected !== undefined, "removeSkinnedPlaceholderMesh");
      expected.dispose(false, true);
    }
  }

  initChildTransformNodes(): void {
    const mainHandEquipmentNode = SceneEntity.createTransformNodeChildOfBone(
      this.rootMesh,
      `${this.entityId}-mh-equipment`,
      "Equipment.R"
    );

    if (mainHandEquipmentNode === undefined) {
      this.childTransformNodes[CombatantBaseChildTransformNodeName.MainHandEquipment] =
        this.rootTransformNode;
    } else {
      this.childTransformNodes[CombatantBaseChildTransformNodeName.MainHandEquipment] =
        mainHandEquipmentNode;
    }

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
    const hitboxCenter = this.bounding.boundingInfo.boundingBox.center;

    hitboxCenterTransformNode.setParent(this.rootTransformNode);
    hitboxCenterTransformNode.position = hitboxCenter.clone();

    this.childTransformNodes[CombatantBaseChildTransformNodeName.HitboxCenter] =
      hitboxCenterTransformNode;

    const hitboxCenterTopTransformNode = new TransformNode(`${this.entityId}-hitbox-center`);
    const hitboxTop = this.bounding.boundingInfo.boundingBox.center.clone();
    hitboxTop.y += this.bounding.boundingInfo.boundingBox.extendSize.y;
    hitboxCenterTopTransformNode.setParent(this.rootTransformNode);
    hitboxCenterTopTransformNode.position = hitboxTop.clone();

    this.childTransformNodes[CombatantBaseChildTransformNodeName.HitboxCenterTop] =
      hitboxCenterTopTransformNode;
  }

  get combatant() {
    return this._combatant;
  }

  customCleanup(): void {
    if (this.debugView) {
      this.debugView.despawnDebugMeshes();
    }
    this.equipmentManager.cleanup();
    this.modularPartsManager.cleanup();
  }

  setVisibility(value: NormalizedPercentage) {
    this.visibility = value;

    this.equipmentManager.setVisibilityForShownHotswapSlots(this.visibility);
    this.modularPartsManager.setVisibility(this.visibility);
  }

  setToDeadPose() {
    this.skeletalAnimationManager.startAnimationWithTransition(SkeletalAnimationName.DeathBack, 0, {
      onlyPlayLastFrame: true,
    });
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

  handleDeath() {
    this.cosmeticEffectManager.softCleanup(() => {
      //
    });

    // end any motion trackers they might have had
    // this is hacky because we would rather have not given them any but
    // it was the easiest way to implement dying on combatant's own turn
    for (const [_movementType, tracker] of this.movementManager.getTrackers()) {
      tracker.onComplete();
    }

    this.movementManager.activeTrackers = {};

    if (this.skeletalAnimationManager.playing) {
      if (this.skeletalAnimationManager.playing.options.onComplete) {
        this.skeletalAnimationManager.playing.runOnComplete();
      }
    }

    // this is purely cosmetic and may be an issue if we revive a flying combatant because their server side
    // home position will be different than where we just put them, but then again maybe we just reset home position
    // to ground when revived
    const wasFlying = this.combatant
      .getCombatantProperties()
      .conditionManager.hasConditionName(CombatantConditionName.Flying);

    if (wasFlying) {
      const groundUnderHomePosition = this.combatant.getHomePosition().clone();
      groundUnderHomePosition.y = 0;
      this.movementManager.startTranslating(groundUnderHomePosition, 1700, {}, () => {
        //
      });
    }

    this.animationControls.startDeathAnimation();
  }
}
