import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testClientReceivesAssetManifestOnConnection(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  expect(alpha.clientApplication.assetService.assetManifest).toBeNull();
  await alpha.startAssetFetch();
  expect(alpha.clientApplication.assetService.assetManifest).not.toBeNull();
}
