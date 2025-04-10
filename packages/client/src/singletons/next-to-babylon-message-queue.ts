import { Combatant } from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";

export interface CombatantModelBlueprint {
  combatant: Combatant;
  homePosition: Vector3;
  homeRotation: Quaternion;
  modelDomPositionElement: HTMLDivElement | null;
}
