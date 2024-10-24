export enum GameMessageType {
  PartyDescent,
  PartyEscape,
  PartyWipe,
  LadderProgress,
  LadderDeath,
}

interface PartyDescentGameMessage {
  type: GameMessageType.PartyDescent;
  partyName: string;
  newFloor: number;
}

interface PartyEscapeGameMessage {
  type: GameMessageType.PartyEscape;
  partyName: string;
  timeOfEscape: number;
}

interface PartyWipeGameMessage {
  type: GameMessageType.PartyWipe;
  partyName: string;
  dlvl: number;
  timeOfWipe: number;
}

interface LadderProgressGameMessage {
  type: GameMessageType.LadderProgress;
  characterName: string;
  playerName: string;
  level: number;
  rank: number;
}

interface LadderDeathGameMessage {
  type: GameMessageType.LadderDeath;
  characterName: string;
  playerName: string;
  level: number;
  rank: number;
}

export type GameMessage =
  | PartyWipeGameMessage
  | PartyEscapeGameMessage
  | PartyDescentGameMessage
  | LadderProgressGameMessage
  | LadderDeathGameMessage;
