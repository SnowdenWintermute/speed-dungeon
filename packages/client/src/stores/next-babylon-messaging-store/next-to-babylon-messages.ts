import {
  ActionResult,
  CombatTurnResult,
  CombatantClass,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common";
import { Vector3 } from "babylonjs";

export enum NextToBabylonMessageTypes {
  SpawnCombatantModel,
  RemoveCombatantModel,
  NewTurnResults,
  NewActionResults,
  StartMovingCombatantIntoCombatActionPosition,
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

type SpawnCombatantModelMessage = {
  type: NextToBabylonMessageTypes.SpawnCombatantModel;
  combatantModelBlueprint: CombatantModelBlueprint;
};

type RemoveCombatantModelMessage = {
  type: NextToBabylonMessageTypes.RemoveCombatantModel;
  entityId: string;
};

type NewTurnResultsMessage = {
  type: NextToBabylonMessageTypes.NewTurnResults;
  turnResults: CombatTurnResult[];
};

type NewActionResultsMessage = {
  type: NextToBabylonMessageTypes.NewActionResults;
  actionResults: ActionResult[];
};

type StartMovingCombatantIntoCombatActionPositionMessage = {
  type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition;
  destinationLocation: Vector3;
  targetPosition: Vector3;
  totalTimeToReachDestination: number;
  onComplete: () => void;
};

export type NextToBabylonMessage =
  | SpawnCombatantModelMessage
  | RemoveCombatantModelMessage
  | NewTurnResultsMessage
  | NewActionResultsMessage
  | StartMovingCombatantIntoCombatActionPositionMessage;
