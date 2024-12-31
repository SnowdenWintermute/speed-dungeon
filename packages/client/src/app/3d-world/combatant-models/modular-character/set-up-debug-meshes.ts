import {
  Color3,
  CreateGreasedLine,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import { ModularCharacter } from "./index.js";

export default function setUpDebugMeshes(this: ModularCharacter) {
  const green = new Color3(0.1, 0.5, 0.3);

  const circle = MeshBuilder.CreateDisc(`${this.entityId}-hitbox-radius`, {
    radius: this.hitboxRadius,
    tessellation: 64,
    sideOrientation: Mesh.DOUBLESIDE,
  });
  const material = new StandardMaterial("discMaterial");
  material.diffuseColor = green; // Red color (RGB: 1, 0, 0)
  circle.material = material;
  circle.visibility = 0.5;
  circle.setPositionWithLocalVector(this.homeLocation.position);
  circle.translate(Vector3.Up(), 0.1);
  circle.rotate(Vector3.Left(), Math.PI / 2);
  circle.setParent(this.rootMesh);

  const sphere = MeshBuilder.CreateIcoSphere("sphere", { subdivisions: 10, radius: 0.2 });
  sphere.setParent(this.rootTransformNode);
  const forward = this.rootTransformNode.forward;
  sphere.position = forward.scale(1.5);
  console.log("set debug mesh");

  const rootMeshLocationBox = MeshBuilder.CreateBox(`${this.entityId}-root-mesh-location-box`, {
    size: 0.25,
  });
  rootMeshLocationBox.setPositionWithLocalVector(this.homeLocation.position);
  rootMeshLocationBox.setParent(this.rootMesh);

  const homeLocationMesh = MeshBuilder.CreateBox(`${this.entityId}-home-location-box`, {
    size: 0.25,
  });
  homeLocationMesh.position = cloneDeep(this.homeLocation.position);

  this.debugMeshes = {
    homeLocationMesh,
  };
}
