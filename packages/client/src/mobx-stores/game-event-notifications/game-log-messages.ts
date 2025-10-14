import { GameMessageType } from "@speed-dungeon/common";
import { ReactNode } from "react";

export class GameLogMessage {
  timestamp: number = new Date().getTime();
  constructor(
    public message: ReactNode,
    public style: GameLogMessageStyle
  ) {}
}

export enum GameLogMessageStyle {
  Basic,
  PartyProgress,
  LadderProgress,
  GameProgress,
  PartyWipe,
  PartyEscape,
  BattleVictory,
  Healing,
  Mana,
}

export const COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE: Record<
  GameMessageType,
  GameLogMessageStyle
> = {
  [GameMessageType.PartyDescent]: GameLogMessageStyle.PartyProgress,
  [GameMessageType.PartyEscape]: GameLogMessageStyle.PartyEscape,
  [GameMessageType.PartyWipe]: GameLogMessageStyle.PartyWipe,
  [GameMessageType.LadderProgress]: GameLogMessageStyle.LadderProgress,
  [GameMessageType.LadderDeath]: GameLogMessageStyle.LadderProgress,
  [GameMessageType.PartyDissolved]: GameLogMessageStyle.PartyWipe,
  [GameMessageType.CraftingAction]: GameLogMessageStyle.Basic,
};

export const GAME_LOG_MESSAGE_STYLE_STRINGS: Record<GameLogMessageStyle, string> = {
  [GameLogMessageStyle.Basic]: "text-slate-400",
  [GameLogMessageStyle.PartyProgress]: "text-yellow-400",
  [GameLogMessageStyle.LadderProgress]: "text-purple-400",
  [GameLogMessageStyle.GameProgress]: "text-teal-300",
  [GameLogMessageStyle.PartyWipe]: "text-red-400",
  [GameLogMessageStyle.PartyEscape]: "text-yellow-400",
  [GameLogMessageStyle.BattleVictory]: "text-yellow-400",
  [GameLogMessageStyle.Healing]: "text-green-600",
  [GameLogMessageStyle.Mana]: "text-blue-600",
};
