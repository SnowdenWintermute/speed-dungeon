import { Quaternion, Vector3 } from "@babylonjs/core";
import { EnvironmentModelTypes } from "../scene-entities/environment-models/environment-model-paths";
import { ClientSequentialEvent } from "@speed-dungeon/common";

export enum ModelActionType {
  ClearAllModels,
  SynchronizeCombatantEquipmentModels,
  ProcessActionCommands,
  SynchronizeCombatantModels,
  SpawnEnvironmentModel,
  DespawnEnvironmentModel,
}

export const MODEL_ACTION_TYPE_STRINGS: Record<ModelActionType, string> = {
  [ModelActionType.SynchronizeCombatantEquipmentModels]: "Synchronize Combatant Equipment Models",
  [ModelActionType.ProcessActionCommands]: "Process Action Commands",
  [ModelActionType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
  [ModelActionType.SpawnEnvironmentModel]: "Spawn Environment Model",
  [ModelActionType.DespawnEnvironmentModel]: "Despawn Environment Model",
  [ModelActionType.ClearAllModels]: "Clear All Models",
};

export interface ChangeEquipmentModelAction {
  type: ModelActionType.SynchronizeCombatantEquipmentModels;
  entityId: string;
}

export interface ProcessActionCommandsModelAction {
  type: ModelActionType.ProcessActionCommands;
  actionCommandPayloads: ClientSequentialEvent[];
}

export interface SynchronizeCombatantModelsModelAction {
  type: ModelActionType.SynchronizeCombatantModels;
  placeInHomePositions: boolean;
}

export interface SpawnEnvironmentalModelModelAction {
  type: ModelActionType.SpawnEnvironmentModel;
  id: string;
  path: string;
  position: Vector3;
  modelType: EnvironmentModelTypes;
  rotationQuat?: Quaternion;
}

export interface DespawnEnvironmentModelModelAction {
  type: ModelActionType.DespawnEnvironmentModel;
  id: string;
}

export interface ClearAllModelsModelAction {
  type: ModelActionType.ClearAllModels;
}

export type ModelAction =
  | ChangeEquipmentModelAction
  | ProcessActionCommandsModelAction
  | SynchronizeCombatantModelsModelAction
  | SpawnEnvironmentalModelModelAction
  | DespawnEnvironmentModelModelAction
  | ClearAllModelsModelAction;
