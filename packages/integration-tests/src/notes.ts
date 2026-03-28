// to create:
// - turn order bar updates on turn end
// - turn order bar shows conditions when tickable condition cast
// - threat decay ticks down visibly
// - threat added when monster hit
// - threat added to all monsters when ally healed
// - firewall ticks down
// - tickable condition stacks removed visually on tick
//
// need to be able to:
// - outfit a party of characters with specific
//   - stats
//   - abilities
//   - test equipment with specific
//     - durability state
//     - affixes with set values
// - enter a battle with monsters with specific
//   - stats
// - to this end we can create "test dungeon floors" filled with rooms of test fixture monsters
//
// - configure test game server with a RandomNumberGenerator that gives constant or scripted rolls (0.5, or [0.1, 0.5,...] for example)
// - trigger player client to dispatch actions to a test game server
// - await resolution of client handling of messages from test game server
// - assert game client state
// - continue with more actions and state assertions for complex scenarios
