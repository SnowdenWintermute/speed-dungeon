export enum GameMessageType {
  PartyDescent,
  PartyEscape,
  PartyWipe,
}

interface PartyDescentGameMessage {
  type: GameMessageType.PartyDescent;
}

interface PartyEscapeGameMessage {
  type: GameMessageType.PartyEscape;
}

interface PartyWipeGameMessage {
  type: GameMessageType.PartyWipe;
  partyName: string;
  dlvl: number;
  timeOfWipe: number;
}

export type GameMessage = PartyWipeGameMessage | PartyEscapeGameMessage | PartyDescentGameMessage;
