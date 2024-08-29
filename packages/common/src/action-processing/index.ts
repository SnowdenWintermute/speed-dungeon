import { CombatAction } from "../combat";
import { EquipmentSlot } from "../items";

export enum ActionCommandType {
  PayAbilityCosts,
  MoveIntoCombatActionPosition,
  PerformCombatAction,
  ReturnHome,
  ChangeEquipment,
  BattleResult,
}

export type PayAbilityCostsActionCommandPayload = {
  type: ActionCommandType.PayAbilityCosts;
  itemIds: string[];
  mp: number;
  hp: number;
};

export type MoveIntoCombatActionPositionActionCommandPayload = {
  type: ActionCommandType.MoveIntoCombatActionPosition;
  primaryTargetId: string;
  isMelee: boolean;
};

export type ReturnHomeActionCommandPayload = {
  type: ActionCommandType.ReturnHome;
  shouldEndTurn: boolean;
};

export type PerformCombatActionActionCommandPayload = {
  type: ActionCommandType.PerformCombatAction;
  combatAction: CombatAction;
  hpChangesByEntityId: null | {
    [entityId: string]: { hpChange: number; isCrit: boolean };
  };
  mpChangesByEntityId: null | {
    [entityId: string]: { mpChange: number };
  };
  // status effects added
  // status effects removed
  missesByEntityId: string[];
};

export type ChangeEquipmentActionCommandPayload = {
  type: ActionCommandType.ChangeEquipment;
  slot: EquipmentSlot;
  equipmentIdOption: null | string;
};

export type BattleResultActionCommandPayload = {
  type: ActionCommandType.BattleResult;
  // conclusion: Victory | Defeat
  // loot: Item[]
  // experiencePointChanges: {[combatantId: string]: number}
  // timestamp: number
};

export type ActionCommandPayload =
  | PayAbilityCostsActionCommandPayload
  | MoveIntoCombatActionPositionActionCommandPayload
  | ReturnHomeActionCommandPayload
  | PerformCombatActionActionCommandPayload
  | ChangeEquipmentActionCommandPayload
  | BattleResultActionCommandPayload;
