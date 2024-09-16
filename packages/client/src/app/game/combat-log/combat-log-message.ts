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
  GameProgress,
  PartyWipe,
  PartyEscape,
  BattleVictory,
  Healing,
}
