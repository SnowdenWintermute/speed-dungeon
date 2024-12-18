export const nextToBabylonMessageQueue: { messages: NextToBabylonMessage[] } = {
  messages: [],
};

import {
  Combatant,
  MoveIntoCombatActionPositionActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "@speed-dungeon/common";
import { Vector3 } from "@babylonjs/core";

export enum NextToBabylonMessageTypes {
  MoveCamera,
  SpawnCombatantModel,
  RemoveCombatantModel,
  StartMovingCombatantIntoCombatActionPosition,
  StartPerformingCombatAction,
  StartReturningHome,
}

export interface CombatantModelBlueprint {
  combatant: Combatant;
  startPosition: Vector3;
  startRotation: number;
  modelCorrectionRotation: number;
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

export type StartMovingCombatantIntoCombatActionPositionMessage = {
  type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition;
  actionCommandPayload: MoveIntoCombatActionPositionActionCommandPayload;
  actionUserId: string;
};

export type StartPerformingCombatActionMessage = {
  type: NextToBabylonMessageTypes.StartPerformingCombatAction;
  actionCommandPayload: PerformCombatActionActionCommandPayload;
  actionUserId: string;
};

export type StartReturningHomeMessage = {
  type: NextToBabylonMessageTypes.StartReturningHome;
  actionCommandPayload: ReturnHomeActionCommandPayload;
  actionUserId: string;
};

// export type ClearCharacterSlotsMessage={
//   type: NextToBabylonMessageTypes.ClearCharacterSlots
// }
// export type DrawCharacterSlotsMessage={
//   type: NextToBabylonMessageTypes.DrawCharacterSlots
// }

export type NextToBabylonMessage =
  | StartMovingCombatantIntoCombatActionPositionMessage
  | StartPerformingCombatActionMessage
  | StartReturningHomeMessage
  | MoveCameraMessage;
