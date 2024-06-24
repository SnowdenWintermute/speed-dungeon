export const LOBBY_CHANNEL = "lobby";
export const PARTY_CHANNEL_PREFIX = "party-";
export const GAME_CHANNEL_PREFIX = "game-";

export function getPartyChannelName(gameName: string, partyName: string): string {
  return `${GAME_CHANNEL_PREFIX}${gameName}-${PARTY_CHANNEL_PREFIX}${partyName}`;
}
