import { Quaternion, Vector3 } from "@babylonjs/core";
import { ActionCommandPayload } from "@speed-dungeon/common";
import { EnvironmentModelTypes } from "../../scene-entities/environment-models/environment-model-paths";

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

export type ChangeEquipmentModelAction = {
  type: ModelActionType.SynchronizeCombatantEquipmentModels;
  entityId: string;
};

export type ProcessActionCommandsModelAction = {
  type: ModelActionType.ProcessActionCommands;
  actionCommandPayloads: ActionCommandPayload[];
};

export type SynchronizeCombatantModelsModelAction = {
  type: ModelActionType.SynchronizeCombatantModels;
};

export type SpawnEnvironmentalModelModelAction = {
  type: ModelActionType.SpawnEnvironmentModel;
  id: string;
  path: string;
  position: Vector3;
  modelType: EnvironmentModelTypes;
  rotationQuat?: Quaternion;
};

export type DespawnEnvironmentModelModelAction = {
  type: ModelActionType.DespawnEnvironmentModel;
  id: string;
};

export type ClearAllModelsModelAction = {
  type: ModelActionType.ClearAllModels;
};

export type ModelAction =
  | ChangeEquipmentModelAction
  | ProcessActionCommandsModelAction
  | SynchronizeCombatantModelsModelAction
  | SpawnEnvironmentalModelModelAction
  | DespawnEnvironmentModelModelAction
  | ClearAllModelsModelAction;
