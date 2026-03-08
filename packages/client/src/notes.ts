// ClientApplication (served from remote or from cached in a service worker)
//
// - GameWorldView (babylonjs world)
// - MenuState (what menu is open, what page, what is hovered, what character is focused)
// - MiscState (stuff the frontend jsx will observe)
//   - Alerts (error/success toast notifications)
//   - Input state (is alternate mode key held)
//   - Asset fetch progress observer
//   - Misc UI Config
//   - Keybinds config
//   - Connection status indicator
//   - Images dynamically created from loaded models (combatant portraits, item thumbnails)
//
//
// - GameEventLog
//   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
//   - exposes a waitForMessageOfTypeProcessed() for tests
//   - observable getUserReadable() to show a WoW style "combat log"
//
// - AssetCache (abstracted to allow different caching strategies, on browser uses IndexedDB)
// - AssetService
//   - handles all frontend calls to getting assets not included in public folder (glb, sounds, textures)
//   - either serves from cache or fetches from remote
//   - starts prefetching all assets on app load
//
// - RuntimeEnvironmentManager (change between online/offline mode and manage persistence of choice/error states)
//   - ConnectionEndpointFactory
//     - Configured to open runtime dependent Websocket (node or browser version) or InMemoryTransport connections (in offline)
//   - OfflineGameServer
//   - OfflineLobbyServer
//   - LobbyClient
//     - GameWorldView (optional)
//     - ConnectionEndpoint
//     - Event handlers
//     - Message dispatcher
//     - LobbyState
//     - SavedCharactersManager
//   - GameClient
//     - GameWorldView (optional)
//     - ConnectionEndpoint
//     - Event handlers
//     - Message dispatcher
//     - GameState
//     - ReplayTreeManager
//
// - NextjsViews
//   - Observes the various observable state
//   - Also can have local state (useStates)
//   - Dispatches messages to LobbyClient and GameClient
//
//class ActionLog {
// For tests and internal observation — every processed message
// waitForProcessed(type: MessageType): Promise<ProcessedMessage>

// // For the UI — only messages that have a human-readable form
// readonly entries: Observable<CombatLogEntry[]>

// // Called by ReplayProcessor — one method, two audiences
// record(message: ProcessedMessage): void {
//   this.internalLog.push(message);
//   this.notifyWaiters(message);

//   const entry = this.toUserReadable(message);
//   if (entry) this.entries.push(entry); // only some messages produce UI entries
// }

// private toUserReadable(message: ProcessedMessage): CombatLogEntry | null {
//   // returns null for internal bookkeeping messages the player doesn't care about
// }
// }
