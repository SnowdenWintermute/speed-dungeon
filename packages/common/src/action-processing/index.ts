export * from "./action-command";
export * from "./action-command-receiver";
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

export function formatActionCommandType(type: ActionCommandType) {
  switch (type) {
    case ActionCommandType.PayAbilityCosts:
      return "Pay ability costs";
    case ActionCommandType.MoveIntoCombatActionPosition:
      return "Move into combat action position";
    case ActionCommandType.PerformCombatAction:
      return "Perform combat action";
    case ActionCommandType.ReturnHome:
      return "Return home";
    case ActionCommandType.ChangeEquipment:
      return "Change equipment";
    case ActionCommandType.BattleResult:
      return "Battle result";
  }
}