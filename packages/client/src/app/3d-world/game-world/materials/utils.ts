import { AbstractMesh, Color3, MultiMaterial } from "@babylonjs/core";

export function lighten(color: Color3, amount: number): Color3 {
  return Color3.Lerp(color, Color3.White(), amount);
}

export function darken(color: Color3, amount: number): Color3 {
  return Color3.Lerp(color, Color3.Black(), amount);
}

export function desaturate(color: Color3, amount: number): Color3 {
  const gray = new Color3(
    (color.r + color.g + color.b) / 3,
    (color.r + color.g + color.b) / 3,
    (color.r + color.g + color.b) / 3
  );
  return Color3.Lerp(color, gray, amount);
}

export function disposeMeshMaterials(mesh: AbstractMesh, nameIncludes: string) {
  // Dispose material on the current mesh
  if (mesh.material) {
    if (mesh.material instanceof MultiMaterial) {
      mesh.material.subMaterials.forEach((subMaterial) => {
        if (subMaterial && subMaterial.name.includes(nameIncludes)) {
          subMaterial.dispose();
        }
      });
    }
    if (mesh.material.name.includes(nameIncludes)) mesh.material.dispose();
  }

  // Recursively handle child meshes
  mesh.getChildMeshes().forEach((childMesh) => disposeMeshMaterials(childMesh, nameIncludes));
}
