import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { invariant } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export async function testNewAssetVersionTriggersRefetch(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");

  const { assetService } = alpha.clientApplication;
  const { progressTracker } = assetService;
  await alpha.startAssetFetch();
  await alpha.resolveAllAssetFetches();
  expect(progressTracker.percentComplete).toBe(100);

  // capture some existing cached asset id so we know one we can change the hash of
  const { testRemoteAssetStore } = alpha;
  const someExpectedCachedAsset = assetService.assetManifest?.entries().next().value;
  invariant(someExpectedCachedAsset !== undefined, "expected at least one cached asset");
  const [cachedAssetId, cachedAssetVersionData] = someExpectedCachedAsset;

  // clear asset manifest (like client refreshed)
  assetService.clearManifest();
  // update some asset hash
  const modifiedData = cloneDeep(cachedAssetVersionData);
  const newVersionHash = "some new hash";
  modifiedData.hash = newVersionHash;
  testRemoteAssetStore.modifyManifestAssetVersion(cachedAssetId, modifiedData);

  // get new manifest
  await alpha.startAssetFetch();
  const expectedUpdateEntry = assetService.assetManifest?.get(cachedAssetId);
  expect(expectedUpdateEntry?.hash).toBe(newVersionHash);
  // expect current fetch count to be 1
  expect(assetService.progressTracker.percentComplete).not.toBe(100);
  expect(assetService.activeFetchCount).toBe(1);
  // complete update
  await alpha.resolveAllAssetFetches();
  expect(assetService.progressTracker.percentComplete).toBe(100);
}
