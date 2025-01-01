"use client";
import React, { useEffect } from "react";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function WebsocketManager() {
  useEffect(() => {
    websocketConnection.connect();
    return () => {
      websocketConnection.disconnect();
    };
  }, []);

  return <div id="websocket-manager" />;
}
