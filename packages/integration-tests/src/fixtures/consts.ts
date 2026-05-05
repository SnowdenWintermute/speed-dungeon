import { GameServerName, Username } from "@speed-dungeon/common";

export const TEST_GAME_SERVER_NAME = "Lindblum Test Server" as GameServerName;
export const LOCAL_LOBBY_SERVER_PORT = 8190;
export const LOCAL_GAME_SERVER_PORT = 8191;
export const LOCAL_LOBBY_URL = localServerUrl(LOCAL_LOBBY_SERVER_PORT);
export const LOCAL_GAME_SERVER_URL = localServerUrl(LOCAL_GAME_SERVER_PORT);

export const TEST_GAME_NAME = "test-game-a";
export const TEST_GAME_NAME_2 = "test-game-b";
export const TEST_PARTY_NAME = "test-party-a";

export const TEST_AUTH_SESSION_ID_PLAYER_1 = "0000";
export const TEST_AUTH_SESSION_ID_PLAYER_2 = "0001";
export const TEST_AUTH_SESSION_ID_PLAYER_3 = "0002";
export const TEST_AUTH_USERNAME_PLAYER_1 = "TestUsername1" as Username;
export const TEST_AUTH_USERNAME_PLAYER_2 = "TestUsername2" as Username;
export const TEST_AUTH_USERNAME_PLAYER_3 = "TestUsername3" as Username;

export const TEST_CHARACTER_NAME_1 = "character 1";
export const TEST_CHARACTER_NAME_2 = "character 2";

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}
