import { Color3, Color4, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { FFIX_COLORS, CombatantTransformProperties } from "@speed-dungeon/common";
import { SceneEntityMovementType } from "../base/scene-entity-movement-manager/movement-tracker";
import { CombatantSceneEntity } from ".";
import { getChildMeshByName, paintCubesOnNodes } from "@/game-world-view/utils";
import { ARMATURE_ROOT_BONE_NAME } from "@/game-world-view/game-world-view-consts";
import { GameWorldView } from "@/game-world-view";

export class CombatantSceneEntityDebug {
  debugMeshes: Mesh[] | null = null;
  transformProperties: CombatantTransformProperties;

  constructor(
    private gameWorldView: GameWorldView,
    private parent: CombatantSceneEntity
  ) {
    this.transformProperties = this.parent.combatant.combatantProperties.transformProperties;
  }

  setShowBones() {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(this.parent.rootMesh, ARMATURE_ROOT_BONE_NAME);

    if (skeletonRootBone !== undefined) {
      return paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.gameWorldView.scene);
    }
    return [];
  }

  setUpDebugMeshes() {
    this.debugMeshes = [
      this.createHomeLocationMarker(),
      this.createForwardDirectionMarkerSphere(),
      this.createRootTransformNodeLocationMarker(),
      this.createDestinationMarkerSphere(),
      // createMeleeRangeDisc(this),
      ...this.setShowBones(),
    ];
  }

  despawnDebugMeshes() {
    if (!this.debugMeshes) {
      return;
    }

    for (const mesh of this.debugMeshes) {
      mesh.dispose(false, true);
    }
  }

  createHomeLocationMarker() {
    const box = MeshBuilder.CreateBox(
      `${this.parent.entityId}-home-location-box`,
      {
        size: 0.1,
        height: 0.4,
      },
      this.gameWorldView.scene
    );
    const material = new StandardMaterial("marker box material", this.gameWorldView.scene);
    // material.diffuseColor = Color3.FromHexString(FFIX_COLORS.iceblue);
    material.diffuseColor = Color3.Red();
    material.alpha = 0.5;
    box.material = material;
    box.position = this.parent.combatant.combatantProperties.transformProperties
      .getHomePosition()
      .clone();
    return box;
  }

  createRootTransformNodeLocationMarker() {
    const box = MeshBuilder.CreateBox(
      `${this.parent.entityId}-root-mesh-location-box`,
      {
        size: 0.25,
      },
      this.gameWorldView.scene
    );
    const material = new StandardMaterial("marker box material", this.gameWorldView.scene);
    material.diffuseColor = Color3.FromHexString(FFIX_COLORS.lightningpurple);
    material.alpha = 0.5;
    box.material = material;
    box.setParent(this.parent.rootTransformNode);
    box.position = Vector3.Zero();
    return box;
  }

  createForwardDirectionMarkerSphere() {
    this.parent.rootTransformNode.computeWorldMatrix(true);
    const direction = Vector3.TransformNormal(
      Vector3.Forward(),
      this.parent.rootTransformNode.getWorldMatrix()
    ).normalize();

    const sphere = MeshBuilder.CreateIcoSphere(
      "sphere",
      { subdivisions: 10, radius: 0.2 },
      this.gameWorldView.scene
    );
    sphere.position = this.parent.rootTransformNode.position.add(direction.scale(1.5));

    sphere.setParent(this.parent.rootTransformNode);

    return sphere;
  }

  createDestinationMarkerSphere() {
    const translationTrackerOption =
      this.parent.movementManager.activeTrackers[SceneEntityMovementType.Translation];
    let destination = this.parent.rootTransformNode.position;

    if (translationTrackerOption) {
      destination = translationTrackerOption.getDestination() as Vector3;
    }

    const sphere = MeshBuilder.CreateIcoSphere(
      "sphere",
      { subdivisions: 10, radius: 0.2 },
      this.gameWorldView.scene
    );
    sphere.position = destination;

    const material = new StandardMaterial("marker box material", this.gameWorldView.scene);
    material.diffuseColor = Color3.FromHexString(FFIX_COLORS.windgreen);
    sphere.material = material;

    return sphere;
  }
}
