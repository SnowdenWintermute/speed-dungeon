export const nextToBabylonMessageQueue: { messages: NextToBabylonMessage[] } = {
  messages: [],
};

import { Combatant } from "@speed-dungeon/common";
import { Vector3 } from "@babylonjs/core";

export enum NextToBabylonMessageTypes {
  MoveCamera,
}

export interface CombatantModelBlueprint {
  combatant: Combatant;
  startPosition: Vector3;
  startRotation: number;
  modelDomPositionElement: HTMLDivElement | null;
}

export type MoveCameraMessage = {
  type: NextToBabylonMessageTypes.MoveCamera;
  instant: boolean;
  alpha: number;
  beta: number;
  radius: number;
  target: Vector3;
};

export type NextToBabylonMessage = MoveCameraMessage;
