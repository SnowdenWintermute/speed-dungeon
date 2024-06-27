export enum GameMessageType {
  PartyDescent,
  PartyEscape,
  PartyWipe,
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

export type GameMessage = PartyWipeGameMessage | PartyEscapeGameMessage | PartyDescentGameMessage;
