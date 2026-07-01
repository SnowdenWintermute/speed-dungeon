import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testClientReceivesAssetManifestOnConnection(
  testFixture: IntegrationTestFixture
) {
  const alpha = testFixture.createClient("alpha");
  alpha.clientApplication.assetService;
  await alpha.connect();
}
