// Freelancer Control Scheme
// - One character per player
// - Ironman saves, progression characters and race records in own "Freelancer" databases
//
// Captains Control Scheme
// - One or more characters per player
// - Ironman saves, progression characters and race records in own "Captains" databases
//
// Base User Account Game Persistence (before buying/earning extra slots or subscribing)
//
// Progression Data
// - 3 Freelancers Progression Character slots
// - 3 Captains Progression Character slots
//
// Ironman Data
// - 2 Ironman saved run slots (slots can hold a game of any character control scheme)
//
// IronmanSavedGameState
// - Serialized SpeedDungeonGame object
// - Save the "time saved" for resuming timers (time spent on current floor) when game loaded
// - Save a Map<IdentityProviderId, Username> to figure out what SpeedDungeonPlayer a
//   joining user controls if they changed their account Username in between save and load
// - On creating a lobby setup for continued Ironman game, require that
//   all players that were in the run have a matching UserSession before game starts
//
// Ladder Record Design Notes
// - a race game's winner can be derrived from the records
// - a user account can derrive a winrate from the records
// - a user account can derrive a game history view over the records
// - user account most played character class
// - various stats can be derrived like
//   .combatant classes more likely to win races
//   .average character level at floor x
//   .other data useful for balance changes
//
// Race/Ironman Game Ladder Entries
// - LadderGameRecord
//   .general game information
//   .references to any participating LadderPartyRecord
// - LadderPartyRecord
//   .general party information
//   .fate (escape/wipe) | null
//   .time of fate
//   .deepest floor reached
//   .references to LadderCharacterRecord
//   .references to PartyTimeOnFloorRecords
// - LadderPartyTimeOnFloorRecord
//   .back reference to LadderGamePartyRecord
//   .how long party spent on floor
//   .can derrive "time to floor x" from TimeOnFloor records
// - LadderCharacterRecord
//   .general character information
//   .references to controlling UserAccountId
//   .references LadderCharacterReachedFloorRecords
// - LadderCharacterReachedFloorRecord
//   .characterPayloadSchemaVersion
//   .recordedAt
//   .character id
//   .characterRecordId
//   .floor number
//   .entire character serialized minus their inventory
//
// Ironman Fresh Run
// - Same as progression except all players must use the character creation UI to make new characters
// - Floor selection disabled / hidden (all characters would only reached floor 1 anyway, no need to change floor selection rules)
// - On each floor descent, save a LadderPartyTimeOnFloorRecord and reset the game.timeCurrentFloorReached
// - On game end (player leaves, party wipes or escapes) update the IronmanSavedGameState and characters
// - Possibly save at other checkpoints to mitigate data lost on game server crash
//
// Ironman Continue Run
// - Any user who had a character in the run can create a game to resume it
// - Once all participating players joined, they can ready up and start the game
//   .this should prevent two users both trying to continue the same saved run
// - On game start, set the party.timeCurrentFloorReached to something like it was reached at a time in the past equal to
//   the time it had been from when it was really reached to the time the game was saved
// - On any player leaving the game, save and close the game for all players
//
// Ironman Run Cleanup (on wipe or escape)
// - delete the run's persistence record
//
// Unranked Race
// - allows a single party since there's no need for a persisted "winner" you can just "race for fun"
// Ranked Race
// - Players can create their own party or join an existing one
// - Once at least two parties with at least one character per party exist, players can ready up and start
// - On party defeat:
//   - if ranked, save a loss record
//   - Send message to other parties
// - On party reach designated floor,
//   - if ranked, save a ladder record of party victory in X place (1st, 2nd etc)
//   - associate that ladder record with each player that was in the party
//
// LOCAL/OFFLINE (user control one or more characters "Captains mode")
// Progression
// Ironman
//
// TESTS
//
// ironman game closed before reconnection
// - player disconnects from ironman run
// - other player in run intentionally leaves
// - run should be closed if any player intentionally leaves
// - disconnected player connects to lobby
// - lobby finds that the run they dc from no longer is in the game session store
// - they don't try to reconnect
//
// ironman run other players set back to lobby on other player leave game
