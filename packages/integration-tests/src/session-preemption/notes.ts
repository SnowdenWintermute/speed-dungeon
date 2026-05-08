// auth session preemption in lobby
// -  session 1 connects
// -  session 2 connects
// -  session 1 shows disconnected and in offline mode and last message received is
//   "you were disconnected because another client with your identity connected"
// - session 2 shows last message "your client preempted another session owned by this account"
//
// auth session preemption in game server
// - session 1 connects
// - session 1 creates game and goes to game server
// - session 2 connects
// - session 1 shows disconnected and in offline mode and last message received is
//   "you were disconnected because another client with your identity connected"
// - session 2 is forwarded to game server
// - session 2 is able to issue inputs in game
// - session 2 shows last message "your client preempted another session owned by this account"
//
// no guest user preemption
// - guest tab 1 connects to game server, is given reconnection token
// - guest tab 2 connects to lobby with same reconnection token (would be shared between tabs)
//
// auth user race against self
// - session 1 session readies up
// - session 2 connects to lobby
// - session 1 already disconnected from lobby
// - session 2 gets sent to game server
// - session 1 connects to game server
// - session 2 connects to game server
