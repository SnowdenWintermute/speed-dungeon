export * from "./action-command.js";
export * from "./action-steps/index.js";
export * from "./game-update-commands.js";
export * from "./action-command-receiver.js";
export * from "./action-command-queue.js";
export * from "./replay-events.js";
export * from "./action-tracker.js";
export * from "./action-sequence-manager.js";
export * from "./action-sequence-manager-registry.js";
export * from "./action-steps/combatant-motion.js";

import { BattleConclusion } from "../battle/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { GameMessageType } from "../packets/game-message.js";
import { EntityId, Milliseconds } from "../primatives/index.js";
import { NestedNodeReplayEvent } from "./replay-events.js";

export enum ActionCommandType {
  CombatActionReplayTree,
  AddDelayToFastestActorTurnSchedulerInBattle,
  BattleResult,
  GameMessages,
  RemovePlayerFromGame,
}

export type CombatActionReplayTreePayload = {
  type: ActionCommandType.CombatActionReplayTree;
  actionUserId: EntityId;
  root: NestedNodeReplayEvent;
};

export type BattleResultActionCommandPayload = {
  type: ActionCommandType.BattleResult;
  conclusion: BattleConclusion;
  partyName: string;
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

export type AddDelayToFastestActorTurnSchedulerInBattlePayload = {
  type: ActionCommandType.AddDelayToFastestActorTurnSchedulerInBattle;
  delay: Milliseconds;
};

export type ActionCommandPayload =
  | CombatActionReplayTreePayload
  | BattleResultActionCommandPayload
  | GameMessagesPayload
  | RemovePlayerFromGamePayload
  | AddDelayToFastestActorTurnSchedulerInBattlePayload;

export const ACTION_COMMAND_TYPE_STRINGS: Record<ActionCommandType, string> = {
  [ActionCommandType.CombatActionReplayTree]: "Combat Action Replay Tree",
  [ActionCommandType.BattleResult]: "Battle result",
  [ActionCommandType.GameMessages]: "Game messages",
  [ActionCommandType.RemovePlayerFromGame]: "Remove player from game",
  [ActionCommandType.AddDelayToFastestActorTurnSchedulerInBattle]:
    "AddDelayToFastestActorTurnSchedulerInBattle",
};
