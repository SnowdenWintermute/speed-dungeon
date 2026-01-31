import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "../test-connection-endpoint-factories.js";
import { testGameSetupToGameHandoff } from "./game-handoff.js";

export async function testGameSetupToHostJoinedGameServer(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  const { hostClient, joinerClient, hostConnectionInstructions, joinerConnectionInstructions } =
    await testGameSetupToGameHandoff(clientEndpointFactory, authSessionIds);

  await hostClient.connectToGameServer(
    clientEndpointFactory,
    hostConnectionInstructions,
    authSessionIds?.hostAuthSessionId || ""
  );

  return { hostClient, joinerClient, joinerConnectionInstructions };
}
