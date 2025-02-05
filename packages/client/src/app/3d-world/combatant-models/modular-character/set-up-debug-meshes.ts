import { Color3, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import { ModularCharacter } from "./index.js";
import { FFIX_COLORS } from "@speed-dungeon/common";

export function setUpDebugMeshes(this: ModularCharacter) {
  this.debugMeshes = [
    createHomeLocationMarker(this),
    createForwardDirectionMarkerSphere(this),
    createRootTransformNodeLocationMarker(this),
    // createMeleeRangeDisc(this),
  ];
}

export function despawnDebugMeshes(this: ModularCharacter) {
  if (this.debugMeshes)
    for (const mesh of this.debugMeshes) {
      mesh.dispose(false, true);
    }
}

function createHomeLocationMarker(modularCharacter: ModularCharacter) {
  const box = MeshBuilder.CreateBox(`${modularCharacter.entityId}-home-location-box`, {
    size: 0.1,
    height: 0.4,
  });
  const material = new StandardMaterial("marker box material");
  material.diffuseColor = Color3.FromHexString(FFIX_COLORS.iceblue);
  material.alpha = 0.5;
  box.material = material;
  box.position = cloneDeep(modularCharacter.homeLocation.position);
  return box;
}

function createRootTransformNodeLocationMarker(modularCharacter: ModularCharacter) {
  const box = MeshBuilder.CreateBox(`${modularCharacter.entityId}-root-mesh-location-box`, {
    size: 0.25,
  });
  const material = new StandardMaterial("marker box material");
  material.diffuseColor = Color3.FromHexString(FFIX_COLORS.lightningpurple);
  material.alpha = 0.5;
  box.material = material;
  box.setParent(modularCharacter.rootTransformNode);
  box.position = Vector3.Zero();
  return box;
}

function createForwardDirectionMarkerSphere(modularCharacter: ModularCharacter) {
  modularCharacter.rootTransformNode.computeWorldMatrix(true);
  const direction = Vector3.TransformNormal(
    Vector3.Forward(),
    modularCharacter.rootTransformNode.getWorldMatrix()
  ).normalize();

  const sphere = MeshBuilder.CreateIcoSphere("sphere", { subdivisions: 10, radius: 0.2 });
  sphere.position = modularCharacter.rootTransformNode.position.add(direction.scale(1.5));

  sphere.setParent(modularCharacter.rootTransformNode);
  return sphere;
}

function createMeleeRangeDisc(modularCharacter: ModularCharacter) {
  const green = new Color3(0.1, 0.5, 0.3);

  const circle = MeshBuilder.CreateDisc(`${modularCharacter.entityId}-hitbox-radius`, {
    radius: modularCharacter.hitboxRadius,
    tessellation: 64,
    sideOrientation: Mesh.DOUBLESIDE,
  });
  const material = new StandardMaterial("discMaterial");
  material.diffuseColor = green; // Red color (RGB: 1, 0, 0)
  circle.material = material;
  circle.visibility = 0.5;
  circle.setPositionWithLocalVector(modularCharacter.homeLocation.position);
  circle.translate(Vector3.Up(), 0.1);
  circle.rotate(Vector3.Left(), Math.PI / 2);
  circle.setParent(modularCharacter.rootMesh);
  return circle;
}
