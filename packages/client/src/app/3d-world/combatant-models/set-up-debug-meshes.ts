import { Color3, Mesh, MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import { ModularCharacter } from "./modular-character";

export default function setUpDebugMeshes(this: ModularCharacter) {
  const red = new Color3(1, 0, 0);
  const blue = new Color3(0, 0, 1);
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

  // const rootMeshDirection = this.rootMesh.forward;
  // const rootMeshForwardLocation = this.rootMesh.position.add(rootMeshDirection.scale(1.5));
  // const rootMeshDirectionLine = CreateGreasedLine(
  //   `${this.entityId}-root-mesh-direction-line`,
  //   {
  //     points: [this.rootMesh.position, rootMeshForwardLocation],
  //     updatable: true,
  //     widths: [0.1],
  //   },
  //   { color: green }
  // );
  const rootMeshLocationBox = MeshBuilder.CreateBox(`${this.entityId}-root-mesh-location-box`, {
    size: 0.25,
  });

  rootMeshLocationBox.setPositionWithLocalVector(this.homeLocation.position);
  // rootMeshLocationBox.position = cloneDeep(this.rootMesh.position);
  rootMeshLocationBox.setParent(this.rootMesh);

  // const direction = this.rootTransformNode.forward;
  // const forwardLocation = this.rootTransformNode.position.add(direction.scale(1.5));
  // const directionLine = CreateGreasedLine(
  //   `${this.entityId}-direction-line`,
  //   {
  //     points: [this.rootTransformNode.position, forwardLocation],
  //     updatable: true,
  //     widths: [0.1],
  //   },
  //   { color: red }
  // );

  // directionLine.setParent(this.rootTransformNode);

  const homeLocationMesh = MeshBuilder.CreateBox(`${this.entityId}-home-location-box`, {
    size: 0.25,
  });
  homeLocationMesh.position = cloneDeep(this.homeLocation.position);

  // const homeDirection = cloneDeep(this.rootTransformNode.forward);
  // const homeForwardLocation = this.rootTransformNode.position.add(homeDirection.scale(1.5));
  // const homeLocationDirectionLine = CreateGreasedLine(
  //   `${this.entityId}-direction-line`,
  //   {
  //     points: [cloneDeep(this.homeLocation.position), homeForwardLocation],
  //     updatable: true,
  //     widths: [0.1],
  //   },
  //   { color: blue }
  // );

  this.debugMeshes = {
    // directionLine,
    homeLocationMesh,
    // homeLocationDirectionLine,
  };
}
