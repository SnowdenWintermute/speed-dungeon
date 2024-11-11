// ONLY IN RACE GAMES:
// on descent, check current time against fastest time this month and this version
// if faster, overwite with
// - floor number
// - time
// - players
// - character names/levels/classes
// - date
// notify players of new record(s)
//
// check against floor records by class / version for each player
// and create / update if needed
// - send message to the players if they exceeded their personal best
//
//
// track and update:
// - best time from game start to floor clear for each floor by month and version
// - each player's best floor times by month and version
//
// each floor time record will hold:
// - floor number
// - time from game start to descent
// - game name
// - party name
// - player names in party
// - user ids in party
// - character names/levels/classes
// - date
// - game version
//
// race game record: (saved on first party escaped or last party wiped)
// - game name
// - partys
//   - name
//   - duration to escape
//   - duration to wipe
//   - player ids
//   - usernames
//   - character names/classes/levels
// - game version
// - date
//
// update player record to keep a list of their record ids
