// ClientIntentGateway
// - accepts player inputs that must be submitted to
//   something beyond the boundary of the local state's authority
// - parameterized with an intent handler on creation such as a WebsocketConnection
//   or LocalClientIntentSender
// - delegates intents to the handler
//
// GameServerIntentReceiver
// - parameterized with a listener such as a WebsocketConnection or LocalClientIntentReceiver
// - sets up handler methods on various ClientIntent types like
//   this.listener.on("eventType", [ middleware1, middleware2 ], handler)
//
// GameServerUpdateGateway
// - provides api for call sites in the game simulation code
// for sending authoritative updates to clients like GameServerUpdateGateway.send("eventType", data)
// - is parameterized with a UpdateDeliveryMechanism like a WebsocketConnection or a LocalGameServerUpdateSender
//
// ClientGameUpdateReceiver
// - basically same thing as GameServerIntentReceiver for the client though
