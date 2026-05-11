// switching between online and offline modes
//
// change toggler to a toggle switch style
//
// on app load
// - display connection status (connecting to lobby)
// - if forwarding to game server, display message
//
// on login
// - display logging in status
//
// on connection to lobby timed out
// - display connection timed out - entered offline mode message
// - enter offline mode
//
// on disconnected from lobby
// - display message
// - enter offline mode
//
// save preferred connection mode
// - localStorage saved preference
// - on app load, show "using preferred mode: offline" if offline
// - on toggle mode, save last mode used as preferred
//
