import { Socket } from "socket.io";
import errorHandler from "../error-handler.js";
import { ERROR_MESSAGES, PlayerAssociatedData } from "@speed-dungeon/common";
import { BrowserTabSession } from "../socket-connection-metadata.js";

export interface ServerPlayerAssociatedData extends PlayerAssociatedData {
  session: BrowserTabSession;
}

export type SocketEventNextFunction<T, U> = (
  eventData: T,
  middlewareProvidedData?: U | undefined
) => Promise<Error | void> | Error | void;

export type MiddlewareFn<T, U> = (
  socket: Socket,
  eventData: T,
  middlewareProvidedData: U | undefined,
  next: SocketEventNextFunction<T, U>
) => Promise<Error | void> | Error | void;

export type EventHandler<T extends any[], M> = (
  ...args: [...T, M]
) => Promise<Error | void> | Error | void;

// from a list of middlewares
export const applyMiddlewares =
  <T, U>(...middlewares: MiddlewareFn<T, U>[]) =>
  // we create a function which takes the socket and the handler
  (
    socket: Socket,
    handler: (
      eventData: T,
      middlewareProvidedData: U,
      socket: Socket
    ) => Promise<Error | void> | Error | void
    // and produces a function which is acceptable in a socket.io event handler
    // this function will create a recursive chain of "next" functions which eventually
    // call the provided handler with the appropriate data provided by the middleware(s)
  ) => {
    // event data implicitly passed from socket.io, middlewareProvidedDataOption is initially undefined
    return async (eventData: T, middlewareProvidedDataOption?: U): Promise<void> => {
      let index = 0; // we keep track of the current middleware index in the closure above
      // the next declaration. All nested calls to next will have access to this variable

      // next will be a middleware at first and finally the event handler.
      // the middleware(s) will call next and pass the correct type of middlewareProvidedDataOption
      // so when next ultimately calls the handler it will be able to pass it
      const next = async (eventData: T, middlewareProvidedDataOption?: U): Promise<void> => {
        const middleware = middlewares[index++]; // get the middleware at the current index then increment it
        if (middleware) {
          // if the index is out of bounds, we must now call the final handler
          try {
            // we pass the next function so this middleware can call it, thus calling the next middleware
            // or the final handler
            await middleware(socket, eventData, middlewareProvidedDataOption, next);
          } catch (error) {
            if (error instanceof Error) errorHandler(socket, error.message);
            else console.trace(error);
          }
        } else {
          // it is possible we wrote a middleware and forgot to pass the correct data
          // or forgot to include any middleware at all, but we must keep the type of middlewareProvidedDataOption
          // as an option because the initial call is from a socket.io event handler which only includes
          // eventData
          if (middlewareProvidedDataOption === undefined)
            return errorHandler(socket, ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);

          try {
            // we should now have the middlewareProvidedDataOption because it was passed by a middleware
            // and we should be checking for it above
            const maybeError = await handler(eventData, middlewareProvidedDataOption, socket);
            if (maybeError instanceof Error) return errorHandler(socket, maybeError.message);
          } catch (error) {
            if (error instanceof Error) errorHandler(socket, error.message);
            else console.trace(error);
          }
        }
      };

      // the first "next" is a middleware with the undefined middlewareProvidedDataOption
      await next(eventData, middlewareProvidedDataOption);
    };
  };
