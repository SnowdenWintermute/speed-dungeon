import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import {
  ActionCommand,
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
}

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
  entityId: string;
  actionCommandPayloads: ActionCommandPayload[];
};

export type ModelAction =
  | SpawnCombatantModelAction
  | DespawnCombatantModelAction
  | ChangeEquipmentModelAction
  | SelectHotswapSlotModelAction
  | ProcessActionCommandsModelAction;
