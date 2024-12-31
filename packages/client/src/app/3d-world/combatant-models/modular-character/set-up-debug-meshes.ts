import { Color3, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import { ModularCharacter } from "./index.js";
import { FFIX_COLORS } from "@speed-dungeon/common";

export default function setUpDebugMeshes(this: ModularCharacter) {
  // createMeleeRangeDisc(this)
  createForwardDirectionMarkerSphere(this);
  createRootTransformNodeLocationMarker(this);
  // const homeLocationMesh = createHomeLocationMarker(this);
}

function createHomeLocationMarker(modularCharacter: ModularCharacter) {
  const box = MeshBuilder.CreateBox(`${modularCharacter.entityId}-home-location-box`, {
    size: 0.25,
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
  console.log(
    "TRANSFORM NODE BEFORE BOX PARENTING",
    modularCharacter.rootTransformNode.position.x,
    modularCharacter.rootTransformNode.position.z
  );
  box.setParent(modularCharacter.rootTransformNode);
  box.position = Vector3.Zero();
}

function createForwardDirectionMarkerSphere(modularCharacter: ModularCharacter) {
  const sphere = MeshBuilder.CreateIcoSphere("sphere", { subdivisions: 10, radius: 0.2 });
  sphere.setParent(modularCharacter.rootTransformNode);
  const forward = modularCharacter.rootTransformNode.forward;
  sphere.position = forward.scale(1.5);
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
}
