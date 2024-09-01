import {
  ActionResult,
  CombatTurnResult,
  CombatantClass,
  CombatantSpecies,
  MoveIntoCombatActionPositionActionCommandPayload,
  PerformCombatActionActionCommandPayload,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { Vector3 } from "babylonjs";

export enum NextToBabylonMessageTypes {
  SpawnCombatantModel,
  RemoveCombatantModel,
  NewTurnResults,
  NewActionResults,
  StartMovingCombatantIntoCombatActionPosition,
  StartPerformingCombatAction,
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
};

export type RemoveCombatantModelMessage = {
  type: NextToBabylonMessageTypes.RemoveCombatantModel;
  entityId: string;
};

export type NewTurnResultsMessage = {
  type: NextToBabylonMessageTypes.NewTurnResults;
  turnResults: CombatTurnResult[];
};

export type NewActionResultsMessage = {
  type: NextToBabylonMessageTypes.NewActionResults;
  actionResults: ActionResult[];
};

export type StartMovingCombatantIntoCombatActionPositionMessage = {
  type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition;
  actionCommandPayload: MoveIntoCombatActionPositionActionCommandPayload;
  actionUserId: string;
  onComplete: () => void;
};

export type StartPerformingCombatActionMessage = {
  type: NextToBabylonMessageTypes.StartPerformingCombatAction;
  actionCommandPayload: PerformCombatActionActionCommandPayload;
  actionUserId: string;
  onComplete: () => void;
};

export type NextToBabylonMessage =
  | SpawnCombatantModelMessage
  | RemoveCombatantModelMessage
  | NewTurnResultsMessage
  | NewActionResultsMessage
  | StartMovingCombatantIntoCombatActionPositionMessage
  | StartPerformingCombatActionMessage;
