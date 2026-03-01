import { ERROR_MESSAGES, MonsterType } from "@speed-dungeon/common";
import { CreateScreenshotUsingRenderTargetAsync, Vector3 } from "@babylonjs/core";
import { LAYER_MASK_1, LAYER_MASK_ALL } from "../index";
import { AppStore } from "@/mobx-stores/app-store";
import { getChildMeshByName } from "../game-world-view-utils";
import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";

export async function createCombatantPortrait(combatantId: string) {
  if (!gameWorldView.current) return;
  const world = gameWorldView.current;
  const combatantModelOption = gameWorldView.current.modelManager.combatantModels[combatantId];
  if (!combatantModelOption) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);

  let headBoneOption = getChildMeshByName(combatantModelOption.rootMesh, "DEF-head");
  if (!headBoneOption) headBoneOption = combatantModelOption.rootMesh;

  const headPosition = headBoneOption.getWorldMatrix().getTranslation();

  const boundingInfo = combatantModelOption.rootMesh.getBoundingInfo();
  const min = boundingInfo.boundingBox.minimumWorld;
  const max = boundingInfo.boundingBox.maximumWorld;

  const width = max.x - min.x;

  // Camera parameters
  const fov = world.portraitCamera.fov;

  // Calculate the distance needed to align the top of the viewport with the top of the bounding box
  const distance = width / (2 * Math.tan(fov / 2)); // Vertical frustum size

  const inFrontOf = combatantModelOption.rootTransformNode.forward.scale(distance);
  const cameraPosition = headPosition.add(new Vector3(0, 0, inFrontOf.z));
  const alphaOffset = -0.2;

  world.portraitCamera.position.copyFrom(cameraPosition);

  world.portraitCamera.setTarget(headPosition);

  world.portraitCamera.alpha += alphaOffset;
  world.portraitCamera.beta -= 0.2;

  if (combatantModelOption.monsterType !== null) {
    const { arcRotate, position } =
      modelPortraitCameraPositionModifiers[combatantModelOption.monsterType];
    const { alpha, beta, radius } = arcRotate;
    world.portraitCamera.alpha += alpha;
    world.portraitCamera.beta += beta;
    world.portraitCamera.radius += radius;
    world.portraitCamera.target.copyFrom(world.portraitCamera.target.add(position));
  } else {
    // humanoid
    world.portraitCamera.target.copyFrom(world.portraitCamera.target.add(new Vector3(0, 0.05, 0)));
  }

  for (const mesh of combatantModelOption.rootMesh.getChildMeshes()) mesh.layerMask = LAYER_MASK_1;

  world.imageManager.portraitEngine.runRenderLoop(() => {});
  const image = await CreateScreenshotUsingRenderTargetAsync(
    // using this engine instead of the main engine somehow works
    // and avoids the flash of low resolution rendering to the main canvas
    world.imageManager.portraitEngine,
    world.portraitCamera,
    { width: 100, height: 100 },
    "image/png"
  );

  // @TODO - stopping this affects item screenshot creation, fix it
  world.imageManager.portraitEngine.stopRenderLoop();

  for (const mesh of combatantModelOption.rootMesh.getChildMeshes())
    mesh.layerMask = LAYER_MASK_ALL;

  AppStore.get().imageStore.setCombatantPortrait(combatantId, image);
}

class ArcRotateParams {
  constructor(
    public alpha: number = 0,
    public beta: number = 0,
    public radius: number = 0
  ) {}
}

const modelPortraitCameraPositionModifiers: Record<
  MonsterType,
  { arcRotate: ArcRotateParams; position: Vector3 }
> = {
  [MonsterType.FireMage]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
  [MonsterType.Cultist]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
  [MonsterType.Wolf]: {
    arcRotate: new ArcRotateParams(0, -0.2, 0.2),
    position: new Vector3(0, -0.1, 0),
  },
  [MonsterType.MantaRay]: {
    arcRotate: new ArcRotateParams(),
    position: new Vector3(0.2, -0.13, 0.9),
  },
  [MonsterType.Net]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
  [MonsterType.Spider]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
};
