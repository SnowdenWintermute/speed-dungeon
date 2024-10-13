import {
  CombatantClass,
  CombatantSpecies,
  MoveIntoCombatActionPositionActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { Vector3 } from "@babylonjs/core";

export enum NextToBabylonMessageTypes {
  SpawnCombatantModel,
  RemoveCombatantModel,
  StartMovingCombatantIntoCombatActionPosition,
  StartPerformingCombatAction,
  StartReturningHome,
}

export interface CombatantModelBlueprint {
  entityId: string;
  species: CombatantSpecies;
  monsterType: null | MonsterType;
  class: CombatantClass;
  startPosition: Vector3;
  startRotation: number;
  modelCorrectionRotation: number;
  modelDomPositionElement: HTMLDivElement | null;
}

export type SpawnCombatantModelMessage = {
  type: NextToBabylonMessageTypes.SpawnCombatantModel;
  combatantModelBlueprint: CombatantModelBlueprint;
  checkIfRoomLoaded: boolean;
};

export type RemoveCombatantModelMessage = {
  type: NextToBabylonMessageTypes.RemoveCombatantModel;
  entityId: string;
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

export type NextToBabylonMessage =
  | SpawnCombatantModelMessage
  | RemoveCombatantModelMessage
  | StartMovingCombatantIntoCombatActionPositionMessage
  | StartPerformingCombatActionMessage
  | StartReturningHomeMessage;
