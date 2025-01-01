import { ERROR_MESSAGES, MonsterType } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { gameWorld } from "../../SceneManager";
import { getChildMeshByName } from "../../utils";
import { CreateScreenshotUsingRenderTarget, Vector3 } from "@babylonjs/core";
import { LAYER_MASK_1, LAYER_MASK_ALL } from "..";

export async function createCombatantPortrait(combatantId: string) {
  return new Promise<Error | void>((resolve, reject) => {
    if (!gameWorld.current) return resolve();
    const world = gameWorld.current;
    const combatantModelOption = gameWorld.current.modelManager.combatantModels[combatantId];
    if (!combatantModelOption) return resolve(new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND));

    let headBoneOption = getChildMeshByName(combatantModelOption.rootMesh, "Head");
    if (!headBoneOption) headBoneOption = combatantModelOption.rootMesh;

    const headPosition = headBoneOption.getWorldMatrix().getTranslation();

    combatantModelOption.updateBoundingBox();
    const boundingInfo = combatantModelOption.rootMesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;
    const width = max.x - min.x;

    // Camera parameters
    const fov = world.portraitCamera.fov;

    // Calculate the distance needed to align the top of the viewport with the top of the bounding box
    const distance = width / (2 * Math.tan(fov / 2)); // Vertical frustum size

    const inFrontOf = combatantModelOption.rootTransformNode.forward.scale(distance);
    let cameraPosition = headPosition.add(new Vector3(0, 0, inFrontOf.z));
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
    }

    for (const mesh of combatantModelOption.rootMesh.getChildMeshes())
      mesh.layerMask = LAYER_MASK_1;

    CreateScreenshotUsingRenderTarget(
      world.engine,
      world.portraitCamera,
      { width: 100, height: 100 },
      (image) => {
        useGameStore.getState().mutateState((state) => {
          state.combatantPortraits[combatantId] = image;
        });

        resolve();
        for (const mesh of combatantModelOption.rootMesh.getChildMeshes())
          mesh.layerMask = LAYER_MASK_ALL;
      },
      "image/png"
    );
  });
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
  [MonsterType.MetallicGolem]: {
    arcRotate: new ArcRotateParams(0, -0.2, 0.2),
    position: new Vector3(0, -0.1, 0),
  },
  [MonsterType.Zombie]: { arcRotate: new ArcRotateParams(), position: new Vector3() },
  [MonsterType.SkeletonArcher]: { arcRotate: new ArcRotateParams(), position: new Vector3() },
  [MonsterType.Scavenger]: {
    arcRotate: new ArcRotateParams(0, 0.3, 0.2),
    position: new Vector3(0, -0.05, 0),
  },
  [MonsterType.Vulture]: { arcRotate: new ArcRotateParams(-0.2, 0, -0.2), position: new Vector3() },
  [MonsterType.FireMage]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
  [MonsterType.Cultist]: { arcRotate: new ArcRotateParams(), position: Vector3.Zero() },
  [MonsterType.FireElemental]: {
    arcRotate: new ArcRotateParams(-0.3, -0.45, 0.8),
    position: new Vector3(0, 1, 0),
  },
  [MonsterType.IceElemental]: {
    arcRotate: new ArcRotateParams(-0.3, -0.45, 0.8),
    position: new Vector3(0, 1, 0),
  },
};
