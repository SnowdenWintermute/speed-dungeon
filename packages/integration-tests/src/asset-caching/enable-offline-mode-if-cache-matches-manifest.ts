import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TARGET_CONCURRENT_ASSET_FETCH_COUNT } from "@speed-dungeon/common";

export async function testEnableOfflineModeIfCacheMatchesNewManifest(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  const { assetService } = alpha.clientApplication;
  const { progressTracker } = assetService;
  // can not enter offline mode before fetching assets
  expect(alpha.clientApplication.topologyManager.canEnterOffline).toBeFalsy();
  expect(assetService.progressTracker.initialized).toBeFalsy();
  await alpha.startAssetFetch();
  expect(assetService.activeFetchCount).toBe(TARGET_CONCURRENT_ASSET_FETCH_COUNT);
  expect(assetService.progressTracker.percentComplete).toBe(0);
  expect(alpha.clientApplication.topologyManager.canEnterOffline).toBeFalsy();
  await alpha.resolveAllAssetFetches();
  expect(progressTracker.percentComplete).toBe(100);
  // can enter offline mode once fetches complete
  expect(alpha.clientApplication.topologyManager.canEnterOffline).toBeTruthy();

  // clear asset manifest (like client refreshed)
  assetService.clearManifest();
  // while no current manifest, don't allow offline mode
  expect(alpha.clientApplication.topologyManager.canEnterOffline).toBeFalsy();
  // get new manifest
  await alpha.startAssetFetch();
  // no fetches should be required because cache already has the assets
  expect(assetService.activeFetchCount).toBe(0);
  expect(assetService.progressTracker.isComplete).toBeTruthy();
  // offline mode should be enabled
  expect(alpha.clientApplication.topologyManager.canEnterOffline).toBeTruthy();
}
