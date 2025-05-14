import { Quaternion, Vector3 } from "@babylonjs/core";

export function quaternionFromTo(from: Vector3, to: Vector3): Quaternion {
  const axis = Vector3.Cross(from, to);
  const angle = Math.acos(Vector3.Dot(from, to));
  return Quaternion.RotationAxis(axis.normalize(), angle);
}
