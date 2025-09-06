import { Quaternion, Vector3 } from "@babylonjs/core";

export interface EntityDestinations {
  translationOption:
    | {
        destination: Vector3;
        duration: number;
      }
    | undefined;
  rotationOption:
    | {
        rotation: Quaternion;
        duration: number;
      }
    | undefined;
}
