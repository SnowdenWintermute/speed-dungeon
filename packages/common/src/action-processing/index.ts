export * from "./action-command.js";
export * from "./action-steps/index.js";
export * from "./game-update-commands.js";
export * from "./action-command-receiver.js";
export * from "./action-command-queue.js";
export * from "./replay-events.js";
export * from "./action-execution-tracker.js";
export * from "./sequential-action-execution-manager.js";
export * from "./sequential-action-manager-registry.js";
import { BattleConclusion } from "../battle/index.js";
import { DurabilityChangesByEntityId } from "../combat/action-results/calculate-action-durability-changes.js";
import { CombatActionName, HpChange } from "../combat/index.js";
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
  actionUserId: string;
  itemIds: string[];
  mp: number;
  hp: number;
};

export type MoveIntoCombatActionPositionActionCommandPayload = {
  type: ActionCommandType.MoveIntoCombatActionPosition;
  actionUserId: string;
  primaryTargetId: string;
  isMelee: boolean;
};

export type ReturnHomeActionCommandPayload = {
  type: ActionCommandType.ReturnHome;
  actionUserId: string;
  shouldEndTurn: boolean;
};

export type PerformCombatActionActionCommandPayload = {
  type: ActionCommandType.PerformCombatAction;
  actionUserId: string;
  actionName: CombatActionName;
  // targets: CombatActionTarget
  // children?: PerformCombatActionActionCommandPayload[]
  hpChangesByEntityId: null | {
    [entityId: string]: HpChange;
  };
  mpChangesByEntityId: null | {
    [entityId: string]: number;
  };
  // condition changes
  missesByEntityId: string[];
  durabilityChanges?: DurabilityChangesByEntityId;
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
  partyChannelToExclude?: string;
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
export function getActionCommandPayloadUserIdOption(payload: ActionCommandPayload) {
  switch (payload.type) {
    case ActionCommandType.BattleResult:
    case ActionCommandType.GameMessages:
    case ActionCommandType.RemovePlayerFromGame:
      return "";
    case ActionCommandType.PayAbilityCosts:
    case ActionCommandType.MoveIntoCombatActionPosition:
    case ActionCommandType.PerformCombatAction:
    case ActionCommandType.ReturnHome:
      return payload.actionUserId;
  }
}
