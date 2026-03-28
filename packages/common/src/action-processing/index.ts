import { BattleConclusion } from "../battle/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { GameMessage } from "../packets/game-message.js";
import { CombatantId, EntityId, EntityName, PartyName, Username } from "../aliases.js";
import { NestedNodeReplayEvent } from "./replay-events.js";

export enum ActionCommandType {
  CombatActionReplayTree,
  BattleResult,
  GameMessages,
  RemovePlayerFromGame,
}

export interface CombatActionReplayTreePayload {
  type: ActionCommandType.CombatActionReplayTree;
  actionUserId: EntityId;
  root: NestedNodeReplayEvent;
  doNotLockInput?: boolean;
}

export interface BattleResultActionCommandPayload {
  type: ActionCommandType.BattleResult;
  conclusion: BattleConclusion;
  partyName: PartyName;
  experiencePointChanges: Record<CombatantId, number>;
  timestamp: number;
  actionEntitiesRemoved: EntityId[];
  loot?: undefined | { equipment: Equipment[]; consumables: Consumable[] };
}

export type LadderDeathsUpdate = Record<
  EntityName,
  { owner: Username; rank: number; level: number }
>;

export interface GameMessagesPayload {
  type: ActionCommandType.GameMessages;
  messages: GameMessage[];
  partyChannelToExclude?: string;
}

export interface RemovePlayerFromGamePayload {
  type: ActionCommandType.RemovePlayerFromGame;
  username: Username;
}

export type ActionCommandPayload =
  | CombatActionReplayTreePayload
  | BattleResultActionCommandPayload
  | GameMessagesPayload
  | RemovePlayerFromGamePayload;

export const ACTION_COMMAND_TYPE_STRINGS: Record<ActionCommandType, string> = {
  [ActionCommandType.CombatActionReplayTree]: "Combat Action Replay Tree",
  [ActionCommandType.BattleResult]: "Battle result",
  [ActionCommandType.GameMessages]: "Game messages",
  [ActionCommandType.RemovePlayerFromGame]: "Remove player from game",
};
