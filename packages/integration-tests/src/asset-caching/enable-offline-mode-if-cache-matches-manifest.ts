import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testEnableOfflineModeIfCacheMatchesNewManifest(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  const { assetService } = alpha.clientApplication;
  const { progressTracker } = assetService;
  const { testRemoteAssetStore } = alpha;
  expect(assetService.progressTracker.initialized).toBeFalsy();
  await alpha.startAssetFetch();
  expect(assetService.progressTracker.percentComplete).toBe(0);
  await alpha.resolveAllAssetFetches();

  expect(progressTracker.percentComplete).toBe(100);

  // disconnect
  // reconnect
  // get new manifest
  // cache should show it contains all assets contained in the newly fetched asset manifest
  // app version number should equal the version number in the newly fetched manifest
  // offline mode should be enabled
}
