import { Combatant } from "@speed-dungeon/common";
import { Vector3 } from "@babylonjs/core";

export interface CombatantModelBlueprint {
  combatant: Combatant;
  startPosition: Vector3;
  startRotation: number;
  modelDomPositionElement: HTMLDivElement | null;
}
