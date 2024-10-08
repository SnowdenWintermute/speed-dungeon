"use client";
import { TabMessageType, useBroadcastChannelStore } from "@/stores/broadcast-channel-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enableMapSet } from "immer";
enableMapSet();

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const router = useRouter();
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
      await fetchToken(code, state, router);

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

  return <div>{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string, router: AppRouterInstance) {
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

    // router.push("/");
  } catch (err) {
    console.log(err);

    // Handle errors
  }
}
