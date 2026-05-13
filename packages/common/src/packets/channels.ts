import { ChannelName } from "../index.js";

export const LOBBY_CHANNEL = "lobby" as ChannelName;
export const PARTY_CHANNEL_PREFIX = "party-";
export const GAME_CHANNEL_PREFIX = "game-";
export const LADDER_UPDATES_CHANNEL_NAME = "ladder-updates" as ChannelName;

export function getPartyChannelName(gameName: string, partyName: string) {
  return `${GAME_CHANNEL_PREFIX}${gameName}-${PARTY_CHANNEL_PREFIX}${partyName}` as ChannelName;
}
