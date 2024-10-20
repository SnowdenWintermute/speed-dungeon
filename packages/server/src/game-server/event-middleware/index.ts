import { Socket } from "socket.io";
import errorHandler from "../error-handler.js";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export type MiddlewareFn<T, U> = (
  socket: Socket,
  eventData: T,
  middlewareProvidedData: U | undefined,
  next: (
    eventData: T,
    middlewareProvidedData?: U | undefined
  ) => Promise<Error | void> | Error | void
) => Promise<Error | void> | Error | void;

export const applyMiddlewares =
  <T, U>(...middlewares: MiddlewareFn<T, U>[]) =>
  (
    socket: Socket,
    handler: (
      socket: Socket,
      eventData: T,
      middlewareProvidedData: U
    ) => Promise<Error | void> | Error | void
  ) => {
    return async (eventData: T, middlewareProvidedDataOption?: U): Promise<void> => {
      let index = 0;

      const next = async (eventData: T, middlewareProvidedDataOption?: U): Promise<void> => {
        const middleware = middlewares[index++];
        if (middleware) {
          try {
            await middleware(socket, eventData, middlewareProvidedDataOption, next);
          } catch (error) {
            if (error instanceof Error) errorHandler(socket, error.message);
            else console.error(error);
          }
        } else {
          if (!middlewareProvidedDataOption)
            return errorHandler(socket, ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);

          try {
            await handler(socket, eventData, middlewareProvidedDataOption);
          } catch (error) {
            if (error instanceof Error) errorHandler(socket, error.message);
            else console.error(error);
          }
        }
      };

      await next(eventData, middlewareProvidedDataOption);
    };
  };
