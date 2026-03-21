import { DynamicTexture, RenderTargetTexture, Scene } from "@babylonjs/core";

export class TextureManager {
  readonly portraitRenderTarget: RenderTargetTexture;
  readonly targetIndicatorTexture: DynamicTexture;

  constructor(scene: Scene) {
    this.portraitRenderTarget = new RenderTargetTexture(
      "portraitTexture",
      { width: 100, height: 100 },
      scene
    );

    const targetIndicatorTexture = new DynamicTexture(
      "target indicator texture",
      256,
      scene,
      false
    );
    targetIndicatorTexture.hasAlpha = true;

    const targetImageUrl = "/img/game-ui-icons/target-icon.svg";
    this.fillDynamicTextureWithSvg(targetImageUrl, targetIndicatorTexture, {
      strokeColor: "white",
      fillColor: "white",
    });
    this.targetIndicatorTexture = targetIndicatorTexture;
  }

  fillDynamicTextureWithSvg(
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
        if (options.fillColor !== undefined) {
          text = text.replace(/fill="[^"]*"/g, `fill="${options.fillColor}"`);
        }
        if (options.strokeColor !== undefined) {
          text = text.replace(/stroke="[^"]*"/g, `stroke="${options.strokeColor}"`);
        }

        // Create a Blob URL from modified SVG string
        const svgBlob = new Blob([text], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          context.drawImage(img, 0, 0, texture.getSize().width, texture.getSize().height);
          texture.update();
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
  }
}
