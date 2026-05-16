// Base User Account Game Persistence (before buying/earning extra slots or subscribing)
//
// Progression Data
// - 3 Freelancers Progression Character slots
// - 3 Captains Progression Character slots
//
// Ironman Data
// - 2 Freelancers Ironman game slots
//   .ref to an IronmanSavedGameState, which in turn references IronmanSavedCharacter id
// - 2 Freelancers Ironman character slots
//   .these can only join a game created from an IronmanSavedGameState referencing their characterIds
// - 1 Captains Ironman game slot
// - 3 Captains Ironman character slots (so they can hold enough for a full party)
//
// IronmanSavedGameState
// - Serialized SpeedDungeonGame object minus the player's characters
// - Save the "time saved" for resuming timers (time spent on current floor) when game loaded
// - Save the player character ids that are in the game
// - On creating a lobby setup for continued Ironman game, require that
//   all players that were in the run join before game starts
// - On join, follow the progression game flow of adding a saved character to the
//   default party, but automatically select from the user account's Ironman saved
//   characters the correct matching characters
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
// Freelancer Control Scheme
// - One character per player
// - Ironman saves, progression characters and race records in own "Freelancer" databases
//
// Captains Control Scheme
// - One or more characters per player
// - Ironman saves, progression characters and race records in own "Captains" databases
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
// - On creation, the game acquires a lock on the "save file" preventing two games trying to continue the same run
// - Once all participating players joined, they can ready up and start the game
// - On game start, set the game.timeCurrentFloorReached to something like it was reached at a time in the past equal to
//   the time it had been from when it was really reached to the time the game was saved
// - On game end, remove the lock on the saved game so it can be resumed later
// - On any player leaving the game, save and close the game for all players
//
// Ironman Run Cleanup (on wipe or escape)
// - delete the run's persistence record of the game-state-minus-party-characters
// - delete saved characters on accounts associated with the game id
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
