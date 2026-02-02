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
//
//  on client startup
//  - await connection
//  - fetch list of updated asset names/logical paths
//  - start pre-fetching all uncached or updatable assets (track progress events to show user loading bar with asset names)
//
//  on game needs asset
//  - check cache
//  - if cached
//    - check if marked as needed update (would be done in the prefetch on app startup)
//    - if so, wait for the update to finish
//    - else, use cached asset
//  - else, wait for pre-fetch to finish
//
//
