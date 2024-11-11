import { GameMessageType } from "@speed-dungeon/common";

export class CombatLogMessage {
  timestamp: number = new Date().getTime();
  constructor(
    public message: string,
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

export function getCombatLogMessageStyleFromGameMessageType(messageType: GameMessageType) {
  switch (messageType) {
    case GameMessageType.PartyDescent:
      return CombatLogMessageStyle.PartyProgress;
    case GameMessageType.PartyEscape:
      return CombatLogMessageStyle.PartyEscape;
    case GameMessageType.PartyWipe:
      return CombatLogMessageStyle.PartyWipe;
    case GameMessageType.LadderProgress:
      return CombatLogMessageStyle.LadderProgress;
    case GameMessageType.LadderDeath:
      return CombatLogMessageStyle.LadderProgress;
    case GameMessageType.PartyDissolved:
      return CombatLogMessageStyle.PartyWipe;
  }
}
