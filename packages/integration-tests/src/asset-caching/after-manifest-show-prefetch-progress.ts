import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testAfterManifestShowPrefetchProgress(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  const { assetService } = alpha.clientApplication;
  const { progressTracker } = assetService;
  const { testRemoteAssetStore } = alpha;
  expect(assetService.progressTracker.initialized).toBeFalsy();
  await alpha.startAssetFetch();
  expect(assetService.progressTracker.percentComplete).toBe(0);
  const { fetches } = assetService.progressTracker;

  const allComplete = () =>
    [...progressTracker.fetches.values()].every((fetch) => fetch.isComplete);

  let previousPercent = 0;
  while (!allComplete()) {
    const inFlightIds = [...progressTracker.fetches.entries()]
      .filter(([_id, fetch]) => fetch.started && !fetch.isComplete)
      .map(([id]) => id);

    for (const id of inFlightIds) {
      await testRemoteAssetStore.resolveFetch(id);
    }

    // wait for onFetchComplete, which runs after the async cacheAsset
    await alpha.eventually(() =>
      expect(inFlightIds.every((id) => fetches.get(id)?.isComplete)).toBe(true)
    );

    expect(progressTracker.percentComplete).toBeGreaterThan(previousPercent);
    previousPercent = progressTracker.percentComplete;
  }

  expect(progressTracker.percentComplete).toBe(100);
}
