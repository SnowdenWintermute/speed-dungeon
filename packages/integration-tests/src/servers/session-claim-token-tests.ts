import { QUERY_PARAMS } from "@speed-dungeon/common";
import { testGameSetupToGameHandoff } from "./fixtures/checkpoints/game-handoff.js";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "./fixtures/test-connection-endpoint-factories.js";
import { testGameSetupToSuccessfulGameReconnect } from "./fixtures/checkpoints/successful-game-reconnect.js";
import { TEST_GAME_SERVER_URL } from "./fixtures/index.js";

export function sessionClaimTokenTests(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  it("session claim token required", async () => {
    const { hostClient, hostConnectionInstructions } = await testGameSetupToGameHandoff(
      clientEndpointFactory,
      authSessionIds
    );

    hostConnectionInstructions.encryptedSessionClaimToken = "";

    const queryParams = {
      name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
      value: hostConnectionInstructions.encryptedSessionClaimToken,
    };

    const endpoint = clientEndpointFactory.createClientEndpoint(hostConnectionInstructions.url, {
      queryParams: [queryParams],
      headers: { cookie: `id=${authSessionIds?.hostAuthSessionId}` },
    });

    hostClient.initializeEndpoint(endpoint);
    await expect(hostClient.connect()).rejects.toThrow();
  });

  it("invalid session claim token", async () => {
    const { hostClient, hostConnectionInstructions } = await testGameSetupToGameHandoff(
      clientEndpointFactory,
      authSessionIds
    );

    hostConnectionInstructions.encryptedSessionClaimToken += " ";

    const queryParams = {
      name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
      value: hostConnectionInstructions.encryptedSessionClaimToken,
    };

    const endpoint = clientEndpointFactory.createClientEndpoint(hostConnectionInstructions.url, {
      queryParams: [queryParams],
    });

    hostClient.initializeEndpoint(endpoint);
    await expect(hostClient.connect()).rejects.toThrow();
  });

  it("session claim token reuse", async () => {
    const { hostClient } = await testGameSetupToSuccessfulGameReconnect(
      clientEndpointFactory,
      authSessionIds
    );

    await hostClient.close();

    const endpoint = clientEndpointFactory.createClientEndpoint(TEST_GAME_SERVER_URL, {
      queryParams: [
        {
          name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
          value: hostClient.sessionClaimToken || "",
        },
      ],
      headers: { cookie: `id=${authSessionIds?.hostAuthSessionId}` },
    });

    hostClient.initializeEndpoint(endpoint);
    await expect(hostClient.connect()).rejects.toThrow();
  });
}
