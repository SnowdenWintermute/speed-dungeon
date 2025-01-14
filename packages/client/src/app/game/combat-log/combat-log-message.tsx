import { GameMessageType } from "@speed-dungeon/common";
import { ReactNode } from "react";

export class CombatLogMessage {
  timestamp: number = new Date().getTime();
  constructor(
    public message: ReactNode,
    public style: CombatLogMessageStyle
  ) {}
}

export enum CombatLogMessageStyle {
  Basic,
  PartyProgress,
  LadderProgress,
  GameProgress,
  PartyWipe,
  PartyEscape,
  BattleVictory,
  Healing,
}

export const COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE: Record<
  GameMessageType,
  CombatLogMessageStyle
> = {
  [GameMessageType.PartyDescent]: CombatLogMessageStyle.PartyProgress,
  [GameMessageType.PartyEscape]: CombatLogMessageStyle.PartyEscape,
  [GameMessageType.PartyWipe]: CombatLogMessageStyle.PartyWipe,
  [GameMessageType.LadderProgress]: CombatLogMessageStyle.LadderProgress,
  [GameMessageType.LadderDeath]: CombatLogMessageStyle.LadderProgress,
  [GameMessageType.PartyDissolved]: CombatLogMessageStyle.PartyWipe,
  [GameMessageType.CraftingAction]: CombatLogMessageStyle.Basic,
};
