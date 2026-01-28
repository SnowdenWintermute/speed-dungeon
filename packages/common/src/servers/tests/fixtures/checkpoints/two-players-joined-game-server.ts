import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToHostJoinedGameServer } from "./host-joined-game-server.js";

export async function testGameSetupToBothPlayersJoined(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient, joinerConnectionInstructions } =
    await testGameSetupToHostJoinedGameServer(clientEndpointFactory);

  await joinerClient.connectToGameServer(clientEndpointFactory, joinerConnectionInstructions);
  const gameStartedMessageListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameStarted
  );

  const gameStartedMessage = await gameStartedMessageListener;
  console.log("game started message:", gameStartedMessage);
  // expect(gameStartedMessage.data.timeStarted).toBeDefined();
  // await hostClient.close();
  await joinerClient.close();

  return { hostClient, joinerClient };
}
