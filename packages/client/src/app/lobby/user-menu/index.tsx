import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { TabMessageType, useBroadcastChannelStore } from "@/stores/broadcast-channel-store";
import { useGameStore } from "@/stores/game-store";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";

export default function UserMenuContainer() {
  const username = useGameStore().username;
  const fetchData = useHttpRequestStore().fetchData;
  const getSessionRequestTrackerName = "get session";
  const responseTracker = useHttpRequestStore().requests[getSessionRequestTrackerName];
  const mutateLobbyState = useLobbyStore().mutateState;
  const mutateGameState = useGameStore().mutateState;
  const showAuthForm = useLobbyStore().showAuthForm;
  const router = useRouter();

  useEffect(() => {
    // check for logged in
    // - when mount component
    // - when login flow complete
    // - when logout pressed
    // - we'll get new usernames when login flow complete or logout pressed because we reset the socket connection
    fetchData(getSessionRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
      method: "GET",
      credentials: "include",
    });
  }, [username]);

  useEffect(() => {
    if (responseTracker && responseTracker.data) {
      const data = responseTracker.data;
      if (typeof data !== "string") {
        const username = data["username"];
        mutateGameState((state) => {
          state.username = username;
        });
      }
    }
  }, [responseTracker?.data]);

  return !responseTracker || responseTracker?.loading ? (
    <div className="h-10 w-10">
      <LoadingSpinner />
    </div>
  ) : responseTracker?.statusCode === 200 && username ? (
    <UserMenu username={username} />
  ) : (
    <ButtonBasic
      onClick={() => {
        router.push("/");

        if (showAuthForm) {
          mutateLobbyState((state) => {
            state.highlightAuthForm = true;
          });
          setTimeout(() => {
            mutateLobbyState((state) => {
              state.highlightAuthForm = false;
            });
          }, 300);
        } else {
          mutateLobbyState((state) => {
            state.showAuthForm = true;
          });
        }
      }}
    >
      LOG IN
    </ButtonBasic>
  );
}

function UserMenu({ username }: { username: null | string }) {
  const firstLetterOfUsername = username ? username.charAt(0) : "";
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const mutateBroadcastState = useBroadcastChannelStore().mutateState;
  const resetSocketConnection = useWebsocketStore().resetConnection;
  const mutateGameState = useGameStore().mutateState;
  const mutateHttpState = useHttpRequestStore().mutateState;
  // on log out
  // send log out to auth server
  // reset socket connection
  // tell other tabs to reset connection
  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
      method: "DELETE",
      credentials: "include",
    });
    mutateHttpState((state) => {
      delete state.requests["get session"];
    });

    mutateGameState((state) => {
      state.username = null;
    });

    resetSocketConnection();
    mutateBroadcastState((state) => {
      // message to have their other tabs reconnect with new cookie
      // to keep socket connections consistent with current authorization
      state.channel.postMessage({ type: TabMessageType.ReconnectSocket });
    });
  }
  return (
    <div className={`flex flex-col h-fit items-end relative`}>
      <button
        id="user-menu-button"
        type="button"
        className={`border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center pb-1 hover:bg-slate-950`}
        aria-controls="user-menu-items"
        aria-expanded={showUserDropdown}
        aria-label={"toggle user menu"}
        onClick={(e) => {
          setShowUserDropdown(!showUserDropdown);
        }}
      >
        <span className="text-lg font-bold">{firstLetterOfUsername.toUpperCase()}</span>
      </button>

      {showUserDropdown && (
        <div className="w-52 absolute border border-slate-400 -top-2 -right-2 pointer-events-none">
          <div className="h-14 flex items-center p-4 mb-[2px]" id="user-menu-spacer">
            <span className="text-lg">User Menu</span>
          </div>
          <div className="bg-slate-700 pointer-events-auto">
            <div className="p-4 text-lg">{username}</div>
            <ul id="user-menu-items" className="pointer-events-auto border-t border-slate-400">
              <UserMenuItem>
                <Link href="/settings" className="h-full w-full flex items-center p-4">
                  Settings
                </Link>
              </UserMenuItem>
              <UserMenuItem>
                <button className="h-full w-full flex items-center p-4" onClick={logout}>
                  Log out
                </button>
              </UserMenuItem>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenuItem({ children }: { children: ReactNode }) {
  return (
    <li className="h-10 border-b border-slate-400 bg-slate-700 flex items-center last:border-b-0 hover:bg-slate-950">
      {children}
    </li>
  );
}
