import { CombatAction } from "../combat";

export enum ActionCommandType {
  PayAbilityCosts,
  MoveIntoCombatActionPosition,
  PerformCombatAction,
  ReturnHome,
}

export type PayAbilityCostsActionCommand = {
  type: ActionCommandType.PayAbilityCosts;
  itemIds: string[];
  mp: number;
  hp: number;
};

export type MoveIntoCombatActionPositionActionCommand = {
  type: ActionCommandType.MoveIntoCombatActionPosition;
  primaryTargetId: string;
  isMelee: boolean;
};

export type ReturnHomeActionCommand = {
  type: ActionCommandType.ReturnHome;
};

export type PerformCombatActionActionCommand = {
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

export type ActionCommand =
  | PayAbilityCostsActionCommand
  | MoveIntoCombatActionPositionActionCommand
  | ReturnHomeActionCommand
  | PerformCombatActionActionCommand;
