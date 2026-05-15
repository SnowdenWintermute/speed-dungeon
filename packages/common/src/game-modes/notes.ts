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
// Race Game Ladder Entries
// - RaceGameRecord
//   .general game information
//   .references to any participating RaceGamePartyRecord
// - RaceGamePartyRecord
//   .general party information
//   .time of escape/wipe
//   .deepest floor reached
//   .references to RaceGameCharacterRecord
// - RaceGameCharacterRecord
//   .general character information
//   .references to UserAccountId controlling
//
// Ironman Run Ladder Entries
// - IronmanRunPartyRecord
//   .general party information
//   .time of escape/wipe
//   .deepest floor reached
//   .references to LadderCharacterRecord
//   .references to PartyTimeOnFloor records
//   .can derrive "time to floor x" from TimeOnFloor records
//
// Freelancer Control Scheme
// - One character per player
// - Ironman saves, progression characters and race records in own "Freelancer" databases
//
// Captains Control Scheme
// - One or more characters per player
// - Ironman saves, progression characters and race records in own "Freelancer" databases
//
// Ironman Fresh Run
// - Same as progression except all players must use the character creation UI to make new characters
// - Floor selection disabled / hidden (all characters would only reached floor 1 anyway, no need to change floor selection rules)
// - On game start, records the "Time floor x entered" for ranking their per-floor times and fastest times-to-floor
// - On each floor descent, save an "ironman party reached floor x in y milliseconds" ladder record
//   associated with each player's account (one record with a two-way ref with their account ids)
//
// Ironman Continue Run
// - Ironman run entire Game class (minus the party characters) is serialized at "checkpoints", the characters are
//   saved in each account's "Ironman Characters" slots and hold a reference to the game id they can be used in
// - On continue, optional game field "continue game characters" restricts which saved characters can be added to the
//   default party. Otherwise can reuse Progression game character selection in game setup logic.
// - Any user who had a character in the run can create a game to resume it
// - On creation, the game acquires a lock on the "save file" preventing two games trying to continue the same run
// - Characters which the owning player has not yet joined show greyed out until their owner joins
// - Once all participating players joined, they can ready up and start the game
// - On start, resume the game's "Speedrun Timer"
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
