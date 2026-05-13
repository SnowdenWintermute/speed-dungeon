import { DynamicAnimationName, InterpolationCurves } from "@speed-dungeon/common";
import { DynamicAnimation } from "./dynamic-animation";
import { AssetContainer, Vector3 } from "@babylonjs/core";

export const DYNAMIC_ANIMATION_NAME_STRINGS: Record<DynamicAnimationName, string> = {
  [DynamicAnimationName.ExplosionDelivery]: "explosion delivery",
  [DynamicAnimationName.ExplosionDissipation]: "explosion dissipation",
  [DynamicAnimationName.IceBurstDelivery]: "ice burst delivery",
  [DynamicAnimationName.IceBurstDissipation]: "ice burst dissipation",
};

export class ExplosionDeliveryAnimation extends DynamicAnimation {
  name = DYNAMIC_ANIMATION_NAME_STRINGS[DynamicAnimationName.ExplosionDelivery];
  duration = 200;
  originalScale: Vector3 = Vector3.One();
  constructor(assetContainer: AssetContainer) {
    super(false);
    const parentMesh = assetContainer.meshes[0];
    if (parentMesh) {
      this.originalScale = parentMesh.scaling;
    }
  }
  animateScene(assetContainer: AssetContainer) {
    const parentMesh = assetContainer.meshes[0];
    if (!parentMesh) {
      return console.error("expected mesh not found in dynamic animation");
    }
    const elapsed = Date.now() - this.timeStarted;
    const percentCompleted = elapsed / this.duration;
    parentMesh.scaling = parentMesh.scaling = this.originalScale.scale(1 + percentCompleted * 1.5);
  }
}

export class ExplosionDissipationAnimation extends DynamicAnimation {
  name = DYNAMIC_ANIMATION_NAME_STRINGS[DynamicAnimationName.ExplosionDelivery];
  duration = 200;
  originalScale: Vector3 = Vector3.One();
  constructor(assetContainer: AssetContainer) {
    super(true);
    const parentMesh = assetContainer.meshes[0];
    if (parentMesh) {
      this.originalScale = parentMesh.scaling;
    }
  }
  animateScene(assetContainer: AssetContainer) {
    const parentMesh = assetContainer.meshes[0];
    if (!parentMesh) return console.error("expected mesh not found in dynamic animation");

    const elapsed = Date.now() - this.timeStarted;
    const percentCompleted = elapsed / this.duration;
    parentMesh.scaling = parentMesh.scaling = this.originalScale.scale(
      1 + InterpolationCurves.easeOut(percentCompleted) * 1.5
    );
    if (parentMesh.material) parentMesh.material.alpha = 1 - percentCompleted;
  }
}

export const DYNAMIC_ANIMATION_CREATORS: Record<
  DynamicAnimationName,
  (assetContainer: AssetContainer) => DynamicAnimation
> = {
  [DynamicAnimationName.ExplosionDelivery]: (assetContainer) =>
    new ExplosionDeliveryAnimation(assetContainer),
  [DynamicAnimationName.ExplosionDissipation]: (assetContainer) =>
    new ExplosionDissipationAnimation(assetContainer),
  [DynamicAnimationName.IceBurstDelivery]: (assetContainer) =>
    new ExplosionDeliveryAnimation(assetContainer),
  [DynamicAnimationName.IceBurstDissipation]: (assetContainer) =>
    new ExplosionDissipationAnimation(assetContainer),
};

export class DynamicAnimantionFactory {
  static create(assetContainer: AssetContainer, name: DynamicAnimationName) {
    return DYNAMIC_ANIMATION_CREATORS[name](assetContainer);
  }
}
