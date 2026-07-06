// DEFERRED TESTS
// @TODO - check these out when finishing offline mode
//
// it("on failed connection, allows offline if all assets cached and last manifest version matches game version", async () => {
// connect and fetch entire manifest
// disconnect
// attempt reconnect
// get failed to connect message
// don't fetch assets yet
// cache should show it contains all assets contained in the cached asset manifest
// app version number should equal the version number in the cached manifest
// offline mode should be enabled
//
// })

// it("on failed connection with incomplete asset cache, displays failure message", async () => {})

// it("disconnect with full cache after manifest received with updated asset", async () => {
// - show indication that asset will update
// - allow offline mode with old asset
// })

// it("on request for uncached asset, live urgent fetches remain in queue", async () => {
// - prefetch starts
// - client requests asset not yet fetched up to the target live fetches limit
// - expect only urgent fetches in the queue
// - client requests another asset
// - expect all previous urgent fetches to still exist
// - expect new fetch to exist, bringing the live fetches count beyond the "target live fetches limit"
// })
//
//
// to play offline mode, must have:
// - a matching app version to last received manifest version
// - an entry exists in the cache for every entry in the manifest

// @IMPROVEMENT
// a more robust solution would allow offline play with a fallback to previous complete cache
// when a client disconnects after receiving the updated manifest but before completing
// fetch of updated assets, we'll keep it simple for now though

// possible states
// - first connect with no cache
// - connect with partial cache, cached manifest matches version number
//   .continue with fetches as normal
// - connect with partial cache, manifest different version number
//   .replace the cached manifest with new manifest
//   .start fetches as normal
// - connect with complete cache, cached manifest matches version number
//   .allow offline mode
// - connect with complete cache, cached manifest different version number
//   .replace cached manifest with new manifest
//   .start fetches as normal
// - failed connection with complete cache, cache manifest matches app version number
//   .allow offline mode
// - failed connection with complete cache, cache manifest different app version number
//   .show error - app version / asset manifest mismatch
