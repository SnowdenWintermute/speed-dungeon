import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToGameHandoff } from "./game-handoff.js";

export async function testGameSetupToHostJoinedGameServer(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient, hostConnectionInstructions, joinerConnectionInstructions } =
    await testGameSetupToGameHandoff(clientEndpointFactory);

  await hostClient.connectToGameServer(clientEndpointFactory, hostConnectionInstructions);

  return { hostClient, joinerClient, joinerConnectionInstructions };
}
