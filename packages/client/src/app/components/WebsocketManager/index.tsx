import { useWebsocketStore } from "@/stores/websocket-store";
import { ServerToClientEvent } from "@speed-dungeon/common";
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
    });
    console.log("socket address: ", socketAddress);
    return () => {
      if (mainSocketOption) mainSocketOption.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mainSocketOption) {
      mainSocketOption.on("connect", () => {
        // console.log("sending test emit", socketOption.connected);
        // socketOption.on("test3", () => console.log("got test3"));
        // socketOption.emit("test2", {});
      });
      mainSocketOption.on(
        ServerToClientEvent.ChannelFullUpdate,
        (channelName, usernamesInChannel) => {
          mutateWebsocketStore((state) => {
            state.mainChannelName = channelName;
            state.usernamesInMainChannel = usernamesInChannel;
          });
          // console.log(data, data2);
        }
      );
    }
  }, [mainSocketOption, connected]);

  // function sendTestMessage() {
  //   if (socketOption) {
  //     console.log(socketOption.connected);
  //     socketOption.emit("test");
  //   }
  // }

  // <button onClick={sendTestMessage}>send</button>
  return <></>;
}

export default SocketManager;
