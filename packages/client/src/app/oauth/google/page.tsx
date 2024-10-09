"use client";
import { TabMessageType, useBroadcastChannelStore } from "@/stores/broadcast-channel-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enableMapSet } from "immer";
enableMapSet();

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const resetSocketConnection = useWebsocketStore().resetConnection;
  const mutateBroadcastState = useBroadcastChannelStore().mutateState;

  const [loadingTextState, setLoadingStateText] = useState("Authenticating...");
  // don't run this effect twice in development using strict mode
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    if (!code || !state)
      return setLoadingStateText("Error authenticating - missing query parameters");
    (async () => {
      await fetchToken(code, state);

      resetSocketConnection();
      mutateBroadcastState((state) => {
        // message to have their other tabs reconnect with new cookie
        // to keep socket connections consistent with current authorization
        state.channel.postMessage({ type: TabMessageType.ReconnectSocket });
      });

      window.opener.postMessage({ googleSignInResult: "success" }, "*");
      window.close();
    })();
  }, [code, state]);

  return <div className="w-full flex justify-center p-4">{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string) {
  try {
    const response = await fetch("http://localhost:8081/oauth/google", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // "Access-Control-Allow-Origin": "http://localhost:8081",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
