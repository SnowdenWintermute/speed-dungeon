import { Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";

export function createTargetingIndicatorBillboard(orbitalTargetNode: TransformNode, scene: Scene) {
  // const plane = MeshBuilder.CreatePlane("billboard", { size: 1 }, scene);
  // plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
  // // Optional: ensure it's not affected by scene lighting
  // const mat = new StandardMaterial("billboardMat", scene);
  // mat.emissiveColor.set(1, 1, 1);
  // plane.material = mat;
}

export function updateTargetingIndicatorBillboard() {
  const a = ";";
  // const camPos = camera.globalPosition;
  // const targetPos = target.getAbsolutePosition();
  // const dir = camPos.subtract(orbitalTargetNode.position).normalize();
  // plane.position.copyFrom(orbitalTargetNode.position).addInPlace(dir.scale(2)); // 2 units away
}
