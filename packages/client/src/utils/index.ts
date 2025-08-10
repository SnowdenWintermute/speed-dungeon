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

export function fillDynamicTextureWithSvg(
  svgUrl: string,
  texture: DynamicTexture,
  options: {
    fillColor?: string;
    strokeColor?: string;
  }
) {
  const context = texture.getContext();

  fetch(svgUrl)
    .then((response) => response.text())
    .then((svgText) => {
      // Replace fill color placeholder or existing fill
      // This assumes your SVG uses a fill attribute you can target
      let text = svgText;
      if (options.fillColor !== undefined)
        text = text.replace(/fill="[^"]*"/g, `fill="${options.fillColor}"`);
      if (options.strokeColor !== undefined)
        text = text.replace(/stroke="[^"]*"/g, `stroke="${options.strokeColor}"`);

      // Create a Blob URL from modified SVG string
      const svgBlob = new Blob([text], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Clear and draw the image on canvas
        // context.fillStyle = "rgba(0,0,0,0)";
        // context.fillRect(0, 0, texture.getSize().width, texture.getSize().height);
        // context.clearRect(0, 0, texture.getSize().width, texture.getSize().height);
        context.drawImage(img, 0, 0, texture.getSize().width, texture.getSize().height);
        texture.update();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
}
