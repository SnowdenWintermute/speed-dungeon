import { ChannelName } from "../index.js";

export const LOBBY_CHANNEL = "lobby" as ChannelName;
export const PARTY_CHANNEL_PREFIX = "party-";
export const GAME_CHANNEL_PREFIX = "game-";

export function getPartyChannelName(gameName: string, partyName: string) {
  return `${GAME_CHANNEL_PREFIX}${gameName}-${PARTY_CHANNEL_PREFIX}${partyName}` as ChannelName;
}
