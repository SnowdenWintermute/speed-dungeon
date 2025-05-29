import {
  AbstractMesh,
  Color3,
  DynamicTexture,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

export function quaternionFromTo(from: Vector3, to: Vector3): Quaternion {
  const axis = Vector3.Cross(from, to);
  const angle = Math.acos(Vector3.Dot(from, to));
  return Quaternion.RotationAxis(axis.normalize(), angle);
}

export function createBillboard(text: string, scene: Scene) {
  const dynamicTexture = new DynamicTexture(
    "dynamic texture",
    { width: 512, height: 256 },
    scene,
    false
  );
  dynamicTexture.hasAlpha = true;
  dynamicTexture.drawText(text, null, 140, "bold 10px Arial", "white", "transparent", true);

  // Apply it to a plane mesh
  const plane = MeshBuilder.CreatePlane("textPlane", { size: 1 }, scene);
  const material = new StandardMaterial("textMaterial", scene);
  material.diffuseTexture = dynamicTexture;
  material.backFaceCulling = false; // So text is visible from behind
  plane.material = material;

  // Set billboard mode
  plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
  return plane;
}
