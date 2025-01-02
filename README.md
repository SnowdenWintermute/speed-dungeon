# Speed Dungeon

This is a multiplayer turn based RPG with 3D graphics for the web browser. Cooperate or compete with friends to race to the bottom of the dungeon, or build a long term character accross multiple sessions.

Play the game: [https://roguelikeracing.com](https://roguelikeracing.com)

Join the Discord: [Discord](https://discord.gg/NxzPFUBVVm)

## Technical Considerations

### What are the main architectural components?

-   The client uses Next.js and Zustand for the UI and Babylon.js to render the 3D game world.
-   The game server uses Node.js to manage player connections to the lobby and game instances.
-   The client and server share a Typescript package of game logic code.
-   Packets are sent between server and client using Socket.IO to synchronize game and lobby state accross client.
-   User accounts are handled by a separate Node.js "identity server" which leverages Postgres and Valkey (redis) containers for user persistence and session managment
-   The game server has it's own Postgres and Valkey containers to manage saved characters and the ranked ladder

### Why are we using mostly static instead of instance methods?

-   Many of our class objects are sent over a websocket connection. When deserializing them, they are a plain JS object and lose all instance methods. To avoid the overhead and complexity of using something like class-transformer we are currently sticking with using static methods and passing the instance of the "class" when needed.
