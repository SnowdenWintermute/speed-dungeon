import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Socket, io } from "socket.io-client";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  UserChannelDisplayData,
} from "@speed-dungeon/common";

export type PartyClientSocket = Socket<ServerToClientEventTypes, ClientToServerEventTypes>;

type WebsocketState = {
  socketOption: Socket<ServerToClientEventTypes, ClientToServerEventTypes>;
  mainChannelName: string;
  usersInMainChannel: { [username: string]: UserChannelDisplayData };
  mutateState: (fn: (state: WebsocketState) => void) => void;
  disconnect: () => void;
  resetConnection: () => void;
};

const socketAddress =
  process.env.NEXT_PUBLIC_PRODUCTION === "production"
    ? "https://roguelikeracing.com"
    : "http://localhost:8080";

export const useWebsocketStore = create<WebsocketState>()(
  immer(
    devtools(
      (set, _get) => {
        const socket = io(socketAddress || "", {
          transports: ["websocket"],
          withCredentials: true,
          autoConnect: false,
        });

        return {
          socketOption: socket,
          usersInMainChannel: {},
          mainChannelName: "",
          mutateState: (fn: (state: WebsocketState) => void) => set(produce(fn)),
          disconnect: () =>
            set(
              produce((state: WebsocketState) => {
                state.socketOption.disconnect();
              })
            ),
          resetConnection: () =>
            set(
              produce((state: WebsocketState) => {
                if (!state.socketOption.connected) return;
                state.socketOption.disconnect();
                console.log("reconnecting");
                state.socketOption = io(socketAddress || "", {
                  transports: ["websocket"],
                  withCredentials: true,
                  autoConnect: true,
                });
              })
            ),
        };
      },
      { enabled: true, name: "websocket store" }
    )
  )
);
