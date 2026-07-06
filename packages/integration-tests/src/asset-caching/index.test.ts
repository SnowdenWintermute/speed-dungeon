import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";

import { testClientReceivesAssetManifestOnConnection } from "./receive-manifest-on-connection";
import { testClientShowsAwaitingManifest } from "./client-shows-awaiting-manifest";
import { testAfterManifestShowPrefetchProgress } from "./after-manifest-show-prefetch-progress";
import { testEnableOfflineModeIfCacheMatchesNewManifest } from "./enable-offline-mode-if-cache-matches-manifest";
import { testNewAssetVersionTriggersRefetch } from "./new-asset-version-received-trigger-refetch";
import { testUrgentFetchPreemptsLowerPriorityFetch } from "./asset-urgent-fetch-preempts-lower-priority-fetches";

export const ASSET_CACHE_TEST_PORT = 8085;

describe("asset management", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("receives manifest on request", async () => {
    await testClientReceivesAssetManifestOnConnection(testFixture);
  });

  it("displays awaiting manifest while manifest receipt pending", async () => {
    await testClientShowsAwaitingManifest(testFixture);
  });

  it("on manifest receipt, displays prefetch progress", async () => {
    await testAfterManifestShowPrefetchProgress(testFixture);
  });

  it("on manifest receipt, enable offline mode if newly fetched cache contains all assets", async () => {
    await testEnableOfflineModeIfCacheMatchesNewManifest(testFixture);
  });

  it("manifest containing updated asset triggers refetch", async () => {
    await testNewAssetVersionTriggersRefetch(testFixture);
  });

  it("on request for uncached asset, preempt prefetch assets", async () => {
    // and "preempted fetches complete eventually"
    await testUrgentFetchPreemptsLowerPriorityFetch(testFixture);
  });
});
