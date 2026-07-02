import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testClientShowsAwaitingManifest(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha");
  expect(alpha.clientApplication.assetService.progressTracker.initialized).toBeFalsy();
  const assetFetchStarted = alpha.startAssetFetch();
  expect(alpha.clientApplication.assetService.progressTracker.initialized).toBeFalsy();
  await assetFetchStarted;
  expect(alpha.clientApplication.assetService.progressTracker.initialized).toBeTruthy();
  expect(alpha.clientApplication.assetService.progressTracker.isComplete).toBeFalsy();
}
