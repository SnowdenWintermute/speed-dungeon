import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { invariant } from "@speed-dungeon/common";

export async function testUrgentFetchPreemptsLowerPriorityFetch(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");

  const { assetService } = alpha.clientApplication;
  const { progressTracker } = assetService;
  // prefetch starts
  await alpha.startAssetFetch();

  const assetIdInManifestNotYetBeingFetched = [...progressTracker.fetches.entries()].find(
    ([assetId, versionData]) => !versionData.started
  )?.[0];

  invariant(
    assetIdInManifestNotYetBeingFetched !== undefined,
    "expected to have at least one asset awaiting fetch start"
  );

  // client requests asset not yet fetched
  assetService.getAsset(assetIdInManifestNotYetBeingFetched);
  // expect the requested asset to now have an active fetch
  expect(progressTracker.fetches.get(assetIdInManifestNotYetBeingFetched)?.started).toBeTruthy();
  // expect some other fetch to have been cancelled
  const someAbortedFetchId = [...progressTracker.fetches].find(([id, fetch]) => fetch.aborted)?.[0];
  expect(someAbortedFetchId).toBeDefined();
  invariant(someAbortedFetchId !== undefined, "test expected above");

  expect(progressTracker.fetches.get(someAbortedFetchId)?.isComplete).toBeFalsy();

  // preempted fetch completes eventually
  await alpha.resolveAllAssetFetches();

  expect(progressTracker.fetches.get(someAbortedFetchId)?.isComplete).toBeTruthy();
}
