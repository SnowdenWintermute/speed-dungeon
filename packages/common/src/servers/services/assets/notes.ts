// sources
// - http
// - indexedDB
// - file system
//
// environments
// - nodejs
// - browser
// - electron
// - capacitor
//
//
// - if online
//   - if not cached, http fetch
//   - if cached, check for updated asset using http
//     - if no new version, use cache
//     - if new version, http fetch
// - if offline
//   - check cache for asset
//   - if not cached, display error "unable to load resource, please connect to the internet"
