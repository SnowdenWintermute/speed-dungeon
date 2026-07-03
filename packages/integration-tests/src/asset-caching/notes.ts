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
