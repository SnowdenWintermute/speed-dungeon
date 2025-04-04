import { Vector3 } from "@babylonjs/core";

export function getTranslationTime(startPosition: Vector3, destination: Vector3, speed: number) {
  const originalPosition = startPosition.clone();
  let distance = Vector3.Distance(originalPosition, destination);
  if (isNaN(distance)) distance = 0;
  return distance * speed;
}
