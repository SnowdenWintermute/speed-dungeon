import { Milliseconds } from "../aliases.js";
import { formatDuration, formatOrdinal } from "../utils/index.js";

export enum GameMessageType {
  PartyDescent,
  PartyEscape,
  PartyWipe,
  LadderProgress,
  LadderDeath,
  PartyDissolved,
  CraftingAction,
  LadderClearTimeRecord,
}

export class GameMessage {
  constructor(
    public type: GameMessageType,
    public showAfterSequentialQueueResolution: boolean,
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
  return `${characterName} [${owner}] died at level ${level}, losing their position of rank ${rank} in the ladder`;
}

export function createLevelLadderExpRankMessage(
  name: string,
  controllingPlayer: string,
  totalExp: number,
  newRank: number
) {
  return `${name} [${controllingPlayer}] now has ${totalExp} total experience points and has risen to rank ${newRank} in the ladder!`;
}

export function createLevelLadderLevelupMessage(
  name: string,
  controllingPlayer: string,
  level: number,
  rank: number
) {
  return `${name} (Rank ${rank}) [${controllingPlayer}] gained level ${level}!`;
}

// what the party is told on every descent, in every mode: their own two times and nothing about
// where either stands. a party learns it placed only from the ladder announcement below, if it
// placed at all
export function createFloorClearedMessage(
  floor: number,
  timeSpentOnFloor: Milliseconds,
  cumulativeTimeToClearFloor: Milliseconds
) {
  return `Cleared floor ${floor} in ${formatDuration(timeSpentOnFloor)} (${formatDuration(cumulativeTimeToClearFloor)} total)`;
}

// the board is described by its own module and handed over composed, which keeps the enums that name
// it out of here — this file is imported from most of the server and stays free of them on purpose
export function createFloorClearTimeRecordMessage(
  partyName: string,
  rank: number,
  boardDescription: string,
  time: Milliseconds
) {
  if (rank === 1) {
    return `Party "${partyName}" set a new record for fastest ${boardDescription} (${formatDuration(time)})!`;
  }
  return `Party "${partyName}" set the ${formatOrdinal(rank)} fastest ${boardDescription} (${formatDuration(time)})`;
}
