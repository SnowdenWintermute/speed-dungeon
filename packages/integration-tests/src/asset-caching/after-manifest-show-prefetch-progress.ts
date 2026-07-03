import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testAfterManifestShowPrefetchProgress(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  expect(alpha.clientApplication.assetService.progressTracker.initialized).toBeFalsy();
  await alpha.startAssetFetch();
  expect(alpha.clientApplication.assetService.progressTracker.percentComplete).toBe(0);
}
