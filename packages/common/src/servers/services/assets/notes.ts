// GameClient needs .glb files to render
// GameServer needs .glb files to know their hitboxes and animation lengths
//
// on a ClientApp we will instantiate a GameClient and GameServer and inject
// both with an appropriate AssetService for their runtime environment
//  - Browser: BrowserAssetService
//    - Fetches with http
//    - Caches to IndexedDB
//  - Electron: ElectronAssetService
//    - Fetches with http
//    - Caches to desktop OS file system
//  - Capacitor: CapacitorAssetService
//    - Fetches with http
//    - Caches to mobile OS file system
//  - Node: NodeAssetService
//    - Fetches not needed
//    - Cache is placed in file system by human
//
//
// AssetService
//
// app shell (Next.js, Babylon.js, Mobx state, Tailwind generated css)
// - Browser: Service Worker backed by CacheStorage
// - Capacitor: ???
// - Electron: ???
//
// asset sources (managed by in-memory abstract asset manager)
// - Browser
//   - http fetch from remote server
//   - indexedDB cache
// - Electron/Capacitor
//   - http fetch from remote server
//   - file system API (capacitor/electron)
//
// environments
// - nodejs
// - browser
// - electron
// - capacitor
//
//
// if online
// - if not cached, http fetch
// - if cached but cache entry marked as willUpdate, http fetch
// - use cached
// if offline
// - we should only allow offline play if cache contains all game assets
// - check cache for asset
// - if somehow not cached, display error "unable to load resource, please connect to the internet"
//
//  on client startup
//  - if cache contains all game assets, allow "offline mode" option
//  - await connection
//  - fetch list of updated asset names/logical paths and file sizes
//  - create an AssetUpdateProgressTracker from this list (for user facing progress bars)
//  - mark cached assets as willUpdate if they have new versions available
//  - create AssetPreFetchQueue of all uncached or updatable assets
//    - AssetId
//    - Priority
//  - sort the AssetPreFetchQueue by each assetId's pre-defined default priority (PreFetchLow, PreFetchHigh)
//    where most are PreFetchLow but we keep some short-list of PreFetchHigh AssetIds
//  - define some TARGET_CONCURRENT_FETCH_COUNT = 2; (or whatever is a good target number)
//    which specifies how many concurrent fetches to strive for during pre-fetch but may be exceeded
//    if many urgent AssetFetch are started
//  - pop the top TARGET_CONCURRENT_FETCH_COUNT entries from the pre-fetch queue and create an AssetFetch for each
//    - AssetId
//    - Priority
//    - Promise<ArrayBuffer>
//    - AbortController
//
//  on game needs asset
//  - if assetId in AssetFetch list
//    - already fetching, all we can do is await it to finish
//  - if assetId cached
//    - check if marked as willUpdate (would be done in the prefetch initialization on app startup)
//    - if not, use cached asset
//  - if cached and marked as willUpdate, but offline (could happen if we fetch update list
//    then disconnect before fetching assets)
//    - use cached asset
//  - if assetId not cached or cached and marked as willUpdate
//    - send abort signal to all assets in the ongoing AssetFetch list not marked
//      as Urgent for their priority
//    - for each AssetFetch that was cancelled, create an AssetPreFetch and put it back
//      in the pre-fetch queue
//    - for the needed asset, remove matching assetId record from pre-fetch queue
//    - create an AssetFetch for this assetId and mark as Urgent priority
//
//  on fetch progress event
//  - if it is Urgent priority, update the corresponding entry in the AssetUpdateProgressTracker
//    with the new percent complete
//  - if not Urgent, it may be cancelled, so only update AssetUpdateProgressTracker if 100% complete
//
//  on fetch complete
//  - if the AssetFetch list size is < TARGET_CONCURRENT_FETCH_COUNT and
//  pre-fetch queue is not empty, pop the next entry from the pre-fetch queue
//  and start a new AssetFetch
