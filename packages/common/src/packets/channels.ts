export const LOBBY_CHANNEL = "lobby";
export const PARTY_CHANNEL_PREFIX = "party-";

export function getPartyChannelName(partyName: string): string {
  return `${PARTY_CHANNEL_PREFIX}${partyName}`;
}
