import { useWebsocketStore } from "@/stores/websocket-store";
import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const mainSocketOption = useWebsocketStore().mainSocketOption;
  const [connected, setConnected] = useState(false);

  // setup socket
  useEffect(() => {
    mutateWebsocketStore((state) => {
      state.mainSocketOption = io(socketAddress || "", {
        transports: ["websocket"],
      });
      state.partySocketOption = io(
        `${socketAddress}${SocketNamespaces.Party}` || "",
        {
          transports: ["websocket"],
        }
      );
    });
    console.log("socket address: ", socketAddress);
    return () => {
      mutateWebsocketStore((state) => {
        state.mainSocketOption?.disconnect();
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mainSocketOption) {
      mainSocketOption.on("connect", () => {});
      mainSocketOption.on(
        ServerToClientEvent.ChannelFullUpdate,
        (channelName, usernamesInChannel) => {
          mutateWebsocketStore((state) => {
            state.mainChannelName = channelName;
            state.usernamesInMainChannel = new Set();
            usernamesInChannel.forEach((username) => {
              console.log(username);
              state.usernamesInMainChannel.add(username);
            });
          });
        }
      );
      mainSocketOption.on(ServerToClientEvent.UserLeftChannel, (username) => {
        console.log("got message to remove ", username);
        mutateWebsocketStore((state) => {
          state.usernamesInMainChannel.delete(username);
        });
      });
    }
  }, [mainSocketOption, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  return <></>;
}

export default SocketManager;
