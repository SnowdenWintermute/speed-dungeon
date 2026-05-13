import { Vector3 } from "@babylonjs/core";
import { MonsterType } from "@speed-dungeon/common";

class ArcRotateParams {
  constructor(
    public alpha: number = 0,
    public beta: number = 0,
    public radius: number = 0
  ) {}
}

export const MODEL_PORTRAIT_CAMERA_POSITIONS: Record<
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
