export enum GameMessageType {
  PartyDescent,
  PartyEscape,
  PartyWipe,
  LadderProgress,
  LadderDeath,
  PartyDissolved,
}

export class GameMessage {
  constructor(
    public type: GameMessageType,
    public showAfterActionQueueResolution: boolean,
    public message: string
  ) {}
}

export function createPartyWipeMessage(partyName: string, dlvl: number, timeOfWipe: Date) {
  return `Party "${partyName}" was defeated on floor ${dlvl} at ${timeOfWipe.toLocaleTimeString()} `;
}

export function createPartyAbandonedMessage(partyName: string) {
  return `Party "${partyName}" was abandoned by its last living character and has been dissolved`;
}

export function createLadderDeathsMessage(
  characterName: string,
  owner: string,
  level: number,
  rank: number
) {
  return `${characterName} [${owner}] died at level ${level}, losing their position of rank ${rank + 1} in the ladder`;
}

export function createLevelLadderRankMessage(
  name: string,
  controllingPlayer: string,
  level: number,
  newRank: number
) {
  return `${name} [${controllingPlayer}] gained level ${level} and rose to rank ${newRank + 1} in the ladder!`;
}
