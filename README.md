# Speed Dungeon

This is a multiplayer turn based RPG with 3D graphics for the web browser. Cooperate or compete with friends to race to the bottom of the dungeon, or build a long term character accross multiple sessions.

Play the game: [https://roguelikeracing.com](https://roguelikeracing.com)

Join the Discord: [Discord](https://discord.gg/NxzPFUBVVm)

## Technical Considerations

### What are the main architectural components?

- The client uses Next.js and MobX for the UI and Babylon.js to render the 3D game world.
- The game server uses Node.js to manage player connections to the lobby and game instances.
- The client and server share a Typescript package of game logic code.
- Packets are sent between server and client using Socket.IO to synchronize game and lobby state accross client.
- User accounts are handled by a separate Node.js "identity server" which leverages Postgres and Valkey (redis) containers for user persistence and session managment
- The game server has it's own Postgres and Valkey containers to manage saved characters and the ranked ladder

### MobX and makeAutoObservable

- We are using MobX because it allows us to have reactive stores on the client which contain
  objects that employ traditional OOP encapsulation techniques like private fields, getters and setters.
- We use a third party MobX library (mobx-store-inheritance) to allow makeAutoObservable on leaf classes: https://github.com/mobxjs/mobx/discussions/2850

### Static vs instance methods

- OLD PHILOSOPHY: Many of our class objects are sent over a websocket connection. When deserializing them, they are a plain
  JS object and lose all instance methods. To avoid the overhead and complexity of using something like
  class-transformer we are currently sticking with using static methods and passing the instance of the "class" when needed.
- NEW PHILOSOPHY: Encapsulation is too valuable to give up. We will add the complexity of serialization and deserialization
  methods to gain the benefits of traditional OOP techniques. To allow for circular references in subsystems that need access
  to their parent classes, we will take on the complexity of initialization functions.

### Typed Event Handler Records

TS asks: what argument would be valid for _any_ possible handler?
Because this is a union of handlers, the parameter type becomes the
intersection of all payload types, which collapses to `never`.
Since we look up handler in a typed record and check it is not undefined
we can say the data is the correct type for the handler

```
const outbox = await handlerOption(parsed.data as never, session);
```

### Common errors and their solutions

- Error description: All of a sudden Typescript complains of missing modules, things are of type unknown, or
  error TS5055: Cannot write file 'some long name.d.ts' because it would overwrite input file.
  Solution: Delete tsconfig.tsbuildinfo, dist folders and .next folder. May need to delete node_modules,
  clear the yarn cache and yarn install.
- Error description: Module not found but the IDE doesn't give errors.
  Solution: Maybe you are importing from a common package incorrectly:
  Check how you’re importing from a common package. Correct:

    import { CombatantConditionFactory } from "@speed-dungeon/common";

    Incorrect:

    import { CombatantConditionFactory } from "@speed-dungeon/common/src/conditions/condition-factory";

    Always import from the package root (@speed-dungeon/common) where the index.ts exports the public API.
    This ensures all .js extensions in the built output resolve correctly for both Node and Next.js.

Explanation:
Importing from src tries to pull in the TypeScript source directly. This breaks because:
Node requires .js extensions in ESM imports, which is handled in the compiled dist files.
Next.js (Turbopack) reads the .js imports in the source and cannot find the corresponding files.

- Error description: TypeError: Class extends value undefined is not a constructor or null or
  some other undefined like MyEnum.Member can't find .Member on Undefined. It is probably a circular
  import.
  Solution: Try using direct path imports in the complaining file instead of importing from a mass
  export file like common/index.ts
