import { Vector3 } from "@babylonjs/core";
import { Combatant } from "../../../combatants/index.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../../../app-consts";

export function getTranslationTime(combatant: Combatant, destination: Vector3) {
  const { combatantProperties } = combatant;
  const originalPosition = combatantProperties.position.clone();
  const speedMultiplier = 1;
  let distance = Vector3.Distance(originalPosition, destination);
  if (isNaN(distance)) distance = 0;
  return distance * COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier;
}
