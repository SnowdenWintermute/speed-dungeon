import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionCommandPayload,
  Equipment,
  HoldableHotswapSlot,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { EnvironmentModelTypes } from "../environment-models/environment-model-paths";

export enum ModelActionType {
  ClearAllModels,
  ChangeEquipment,
  SelectHotswapSlot,
  ProcessActionCommands,
  SynchronizeCombatantModels,
  SpawnEnvironmentModel,
  DespawnEnvironmentModel,
}

export const MODEL_ACTION_TYPE_STRINGS: Record<ModelActionType, string> = {
  [ModelActionType.ChangeEquipment]: "Change Equipment",
  [ModelActionType.SelectHotswapSlot]: "Select Hotswap Slot",
  [ModelActionType.ProcessActionCommands]: "Process Action Commands",
  [ModelActionType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
  [ModelActionType.SpawnEnvironmentModel]: "Spawn Environment Model",
  [ModelActionType.DespawnEnvironmentModel]: "Despawn Environment Model",
  [ModelActionType.ClearAllModels]: "Clear All Models",
};

export type ChangeEquipmentModelAction = {
  type: ModelActionType.ChangeEquipment;
  entityId: string;
  unequippedIds: string[];
  toEquip?: { item: Equipment; slot: TaggedEquipmentSlot };
};

export type SelectHotswapSlotModelAction = {
  type: ModelActionType.SelectHotswapSlot;
  entityId: string;
  hotswapSlots: HoldableHotswapSlot[];
  selectedIndex: number;
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
  | SelectHotswapSlotModelAction
  | ProcessActionCommandsModelAction
  | SynchronizeCombatantModelsModelAction
  | SpawnEnvironmentalModelModelAction
  | DespawnEnvironmentModelModelAction
  | ClearAllModelsModelAction;
