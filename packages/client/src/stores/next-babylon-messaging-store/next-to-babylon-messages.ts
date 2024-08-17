import {
  ActionResult,
  CombatTurnResult,
  CombatantClass,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common/src/monsters/monster-types";
import { Vector3 } from "babylonjs";

export enum NextToBabylonMessageTypes {
  SpawnCombatantModel,
  RemoveCombatantModel,
  NewTurnResults,
  NewActionResults,
  // SetCombatantDomRef,
}

export interface CombatantModelBlueprint {
  entityId: string;
  species: CombatantSpecies;
  monsterType: null | MonsterType;
  class: CombatantClass;
  startPosition: Vector3;
  startRotation: number;
  modelDomPositionRef: React.RefObject<HTMLDivElement>;
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

// type SetCombatantDomRefMessage = {
//   type: NextToBabylonMessageTypes.SetCombatantDomRef;
//   combatantId: string;
//   babylonModelDomPositionRef: React.RefObject<HTMLDivElement>;
// };

export type NextToBabylonMessage =
  | SpawnCombatantModelMessage
  | RemoveCombatantModelMessage
  | NewTurnResultsMessage
  | NewActionResultsMessage
  // | SetCombatantDomRefMessage
  ;
