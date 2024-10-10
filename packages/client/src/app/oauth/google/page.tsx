"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enableMapSet } from "immer";
import {
  reconnectWebsocketInAllTabs,
  refetchAuthSessionInAllTabs,
} from "@/app/lobby/auth-form/auth-utils";
enableMapSet();

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const authorizationCode = searchParams.get("code");

  const [loadingTextState, setLoadingStateText] = useState("Authenticating...");
  // don't run this effect twice in development using strict mode
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    if (!authorizationCode || !state)
      return setLoadingStateText("Error authenticating - missing query parameters");
    (async () => {
      await fetchToken(authorizationCode, state);
      refetchAuthSessionInAllTabs();
      reconnectWebsocketInAllTabs();
      window.close();
    })();
  }, [authorizationCode, state]);

  return <div className="w-full flex justify-center p-4">{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string) {
  try {
    await fetch("http://localhost:8081/oauth/google", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // "Access-Control-Allow-Origin": "http://localhost:8081",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });
  } catch (err) {
    console.error(err);
  }
}
