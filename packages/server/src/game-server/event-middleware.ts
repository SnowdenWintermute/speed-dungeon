import { Socket } from "socket.io";
import errorHandler from "./error-handler.js";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

type MiddlewareFn<T> = (
  socket: Socket,
  data: T | undefined,
  next: (data?: T | undefined) => Promise<Error | void> | Error | void
) => Promise<Error | void> | Error | void;

export const applyMiddlewares =
  <T>(...middlewares: MiddlewareFn<T>[]) =>
  (socket: Socket, handler: (socket: Socket, data: T) => Promise<Error | void> | Error | void) => {
    return async (dataOption?: T): Promise<void> => {
      let index = 0; // Initialize index when the middleware chain is invoked
      console.log("index: ", index);

      const next = async (dataOption?: T): Promise<void> => {
        const middleware = middlewares[index++]; // Move to the next middleware
        if (middleware) {
          try {
            console.log("running middleware");
            // Await middleware and pass `next` as callback to go to the next middleware
            await middleware(socket, dataOption, next);
          } catch (error) {
            console.error("Middleware error:", error);
            errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
          }
        } else {
          // All middlewares have completed, invoke the final handler
          if (!dataOption) {
            return errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
          }
          try {
            await handler(socket, dataOption);
          } catch (error) {
            console.error("Handler error:", error);
            errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
          }
        }
      };

      // Start processing the middlewares
      await next(dataOption);
    };
  };

// export const applyMiddlewares =
//   <T>(...middlewares: MiddlewareFn<T>[]) =>
//   (socket: Socket, handler: (socket: Socket, data: T) => Promise<Error | void> | Error | void) => {

//     // if there is a next middleware, run it
//     // if not, run the handler
//     const next = async (dataOption?: T) => {
//       let index = 0;
//       const middleware = middlewares[index++];
//       console.log("running middleware: ", middleware);
//       if (middleware !== undefined) await middleware(socket, dataOption, next);
//       else {
//         console.log("trying to run handler:", handler);
//         console.log(dataOption, "after middlewares completed");
//         if (!dataOption) return errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
//         index = 0;
//         await handler(socket, dataOption);
//       }
//     };

//     return (dataOption: T | undefined) => next(dataOption);
//   };

// Middleware for error handling
const errorMiddleware: MiddlewareFn<any> = (socket, data: any, next) => {
  const maybeError = next(data);
  if (maybeError instanceof Error) errorHandler(socket, maybeError.message);
};

// Middleware for player data retrieval
type PlayerAssociatedData = { playerId: string }; // Replace with your actual data type

export const playerDataMiddleware: MiddlewareFn<{
  characterId: string;
  [key: string]: any;
}> = async (socket, data, next) => {
  // if (!data) return new Error("Expected handler data not found");
  // if (!gameServer) return new Error("No game server");
  // const [_, socketMeta] = gameServer.getConnection<
  //   ClientToServerEventTypes,
  //   ServerToClientEventTypes
  // >(socket.id);
  //
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, 300);
  });

  console.log("ran middleware");

  // const gameResult = gameServer.getSocketCurrentGame(socketMeta);
  // if (gameResult instanceof Error) return gameResult;
  // const game = gameResult;
  // const partyResult = SpeedDungeonGame.getPlayerParty(game, socketMeta.username);
  // if (partyResult instanceof Error) return partyResult;
  // const party = partyResult;
  // const playerOption = game.players[socketMeta.username];
  // if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  // const player = playerOption;

  // const characterResult = AdventuringParty.getCharacterIfOwned(
  //   party,
  //   player.characterIds,
  //   data.characterId
  // );
  // if (characterResult instanceof Error) return characterResult;
  // const character = characterResult;
  // const playerAssociatedData: PlayerAssociatedData = { playerId: socket.id }; // Replace with actual logic
  console.log("calling next with: ", {
    characterId: "aoeuaoue",
    playerAssociatedData: { playerId: "some id" },
  });
  next({ characterId: "aoeuaoue", playerAssociatedData: { playerId: "some id" } });
};

// Example handler
const toggleReadyToExploreHandler = (playerData: PlayerAssociatedData) => {
  console.log(`Player ${playerData.playerId} toggled ready to explore`);
};

// Usage
const socketHandler = (socket: Socket) => {
  // Registering event with middleware
  socket.on(
    "toggleReadyToExplore",
    applyMiddlewares(errorMiddleware, playerDataMiddleware)(
      socket,
      (socket, playerData: PlayerAssociatedData) => {
        toggleReadyToExploreHandler(playerData);
      }
    )
  );
};
