import { useWebsocketStore } from "@/stores/websocket-store";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const socketOption = useWebsocketStore().socketOption;
  const [connected, setConnected] = useState(false);

  // setup socket
  useEffect(() => {
    mutateWebsocketStore((state) => {
      state.socketOption = io(socketAddress || "", {
        transports: ["websocket"],
      });
    });
    console.log("socket address: ", socketAddress);
    return () => {
      if (socketOption) socketOption.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (socketOption) {
      socketOption.on("connect", () => {
        // console.log("sending test emit", socketOption.connected);
        // socketOption.on("test3", () => console.log("got test3"));
        // socketOption.emit("test2", {});
      });
    }
  }, [socketOption, connected]);

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
