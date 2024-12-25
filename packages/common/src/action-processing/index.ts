export * from "./action-command.js";
export * from "./action-command-receiver.js";
export * from "./action-command-queue.js";
import { BattleConclusion } from "../battle/index.js";
import { CombatAction, HpChange } from "../combat/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { GameMessageType } from "../packets/game-message.js";

export enum ActionCommandType {
  PayAbilityCosts,
  MoveIntoCombatActionPosition,
  PerformCombatAction,
  ReturnHome,
  BattleResult,
  GameMessages,
  RemovePlayerFromGame,
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
    [entityId: string]: HpChange;
  };
  mpChangesByEntityId: null | {
    [entityId: string]: number;
  };
  // status effects added
  // status effects removed
  missesByEntityId: string[];
};

export type BattleResultActionCommandPayload = {
  type: ActionCommandType.BattleResult;
  conclusion: BattleConclusion;
  experiencePointChanges: { [combatantId: string]: number };
  timestamp: number;
  loot?: undefined | { equipment: Equipment[]; consumables: Consumable[] };
};

export type LadderDeathsUpdate = {
  [combatantName: string]: { owner: string; rank: number; level: number };
};

export type GameMessagesPayload = {
  type: ActionCommandType.GameMessages;
  messages: { text: string; type: GameMessageType }[];
};

export type RemovePlayerFromGamePayload = {
  type: ActionCommandType.RemovePlayerFromGame;
  username: string;
};

export type ActionCommandPayload =
  | PayAbilityCostsActionCommandPayload
  | MoveIntoCombatActionPositionActionCommandPayload
  | ReturnHomeActionCommandPayload
  | PerformCombatActionActionCommandPayload
  | BattleResultActionCommandPayload
  | GameMessagesPayload
  | RemovePlayerFromGamePayload;

export const ACTION_COMMAND_TYPE_STRINGS: Record<ActionCommandType, string> = {
  [ActionCommandType.PayAbilityCosts]: "Pay ability costs",
  [ActionCommandType.MoveIntoCombatActionPosition]: "Move into combat action position",
  [ActionCommandType.PerformCombatAction]: "Perform combat action",
  [ActionCommandType.ReturnHome]: "Return home",
  [ActionCommandType.BattleResult]: "Battle result",
  [ActionCommandType.GameMessages]: "Game messages",
  [ActionCommandType.RemovePlayerFromGame]: "Remove player from game",
};

// - change equipment shouldn't lock input
// - can't change equipment in battle unless input not locked and have the special trait
//   (can change while other players are deciding their move)
// -
