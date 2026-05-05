import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testRetryLostInitialConnectionInstructions(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  // auth user receives connection instructions
  // disconnects
  // reconnects to lobby server
  // there should be no reconnection opportunity in the shared store
  // their global auth session should show "initial connection"
  // issue them new connection instructions
  // should connect to game server
}
