import { DynamicTexture, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";

export function createTextPlane(text: string, scene: Scene) {
  const plane = MeshBuilder.CreatePlane("textPlane", { width: 5, height: 2 }, scene);

  const dynamicTexture = new DynamicTexture(
    "dynamicTexture",
    { width: 512, height: 256 },
    scene,
    true
  );
  dynamicTexture.hasAlpha = true;

  // Draw text on the texture
  dynamicTexture.drawText(text, 50, 150, "bold 48px Arial", "white", "transparent");

  // Apply the texture to the plane
  const material = new StandardMaterial("textMaterial", scene);
  material.diffuseTexture = dynamicTexture;
  material.backFaceCulling = false; // Allow text to be visible from both sides
  plane.material = material;
  return plane;
}
