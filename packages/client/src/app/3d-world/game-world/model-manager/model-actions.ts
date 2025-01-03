import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import {
  ActionCommandPayload,
  Equipment,
  HoldableHotswapSlot,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";

export enum ModelActionType {
  SpawnCombatantModel,
  DespawnCombatantModel,
  ChangeEquipment,
  SelectHotswapSlot,
  ProcessActionCommands,
  SynchronizeCombatantModels,
}

export const MODEL_ACTION_TYPE_STRINGS: Record<ModelActionType, string> = {
  [ModelActionType.SpawnCombatantModel]: "Spawn Combatant Model",
  [ModelActionType.DespawnCombatantModel]: "Despawn Combatant Model",
  [ModelActionType.ChangeEquipment]: "Change Equipment",
  [ModelActionType.SelectHotswapSlot]: "Select Hotswap Slot",
  [ModelActionType.ProcessActionCommands]: "Process Action Commands",
  [ModelActionType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
};

export type SpawnCombatantModelAction = {
  type: ModelActionType.SpawnCombatantModel;
  blueprint: CombatantModelBlueprint;
};

export type DespawnCombatantModelAction = {
  type: ModelActionType.DespawnCombatantModel;
  entityId: string;
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

export type ModelAction =
  | SpawnCombatantModelAction
  | DespawnCombatantModelAction
  | ChangeEquipmentModelAction
  | SelectHotswapSlotModelAction
  | ProcessActionCommandsModelAction
  | SynchronizeCombatantModelsModelAction;
