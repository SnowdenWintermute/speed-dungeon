import { PartyName } from "../../../../aliases.js";
import { ClientIntentType } from "../../../../packets/client-intents.js";
import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "../test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersJoinedLobbyGame } from "./two-players-joined-lobby-game.js";

export async function testGameSetupToTwoPlayersInParty(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  const { hostClient, joinerClient } = await testGameSetupToTwoPlayersJoinedLobbyGame(
    clientEndpointFactory,
    authSessionIds
  );

  let partyName = "" as PartyName;
  const hostCreatePartyMessage = await hostClient.sendMessageAndAwaitReplyType(
    { type: ClientIntentType.CreateParty, data: { partyName } },
    GameStateUpdateType.PartyCreated
  );
  partyName = hostCreatePartyMessage.data.partyName;

  await joinerClient.sendMessageAndAwaitReplyType(
    { type: ClientIntentType.JoinParty, data: { partyName } },
    GameStateUpdateType.PlayerChangedAdventuringParty
  );

  return { hostClient, joinerClient, partyName };
}
