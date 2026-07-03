import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";

import { testClientReceivesAssetManifestOnConnection } from "./receive-manifest-on-connection";
import { testClientShowsAwaitingManifest } from "./client-shows-awaiting-manifest";
import { testAfterManifestShowPrefetchProgress } from "./after-manifest-show-prefetch-progress";

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

  // it("on manifest receipt, enable offline mode if cache contains all assets", async () => {})
  // it("on prefetch complete, asset count in cache equals manifest asset count", async () => {})
  // it("on prefetch completed, enable offline mode", async () => {})
  // it("on failed connection, allows offline if all assets cached and last manifest version matches game version", async () => {})
  // it("on failed connection with incomplete asset cache, displays failure message", async () => {})

  // it("manifest contains updated asset", async () => {
  // - show indication that asset will update
  // - expect new asset version to be visible after update completed
  // })

  // it("disconnect with full cache after manifest received with updated asset", async () => {
  // - show indication that asset will update
  // - allow offline mode with old asset
  // })

  // it("preempted fetches complete eventually", async () => {
  // - after full update, able to find an asset that was preempted/aborted in the cache (aborted fetches properly rescheduled)
  // })

  // it("on request for uncached asset, preempt prefetch assets", async () => {
  // - prefetch starts
  // - client requests asset not yet fetched
  // - expect the requested asset to now have an active fetch
  // - expect the preempted fetch to be cancelled
  // })

  // it("on request for uncached asset, live urgent fetches remain in queue", async () => {
  // - prefetch starts
  // - client requests asset not yet fetched up to the target live fetches limit
  // - expect only urgent fetches in the queue
  // - client requests another asset
  // - expect all previous urgent fetches to still exist
  // - expect new fetch to exist, bringing the live fetches count beyond the "target live fetches limit"
  // })
});
