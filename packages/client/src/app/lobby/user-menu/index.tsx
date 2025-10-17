"use client";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { useRouter } from "next/navigation";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { ZIndexLayers } from "@/app/z-index-layers";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { TabMessageType, broadcastChannel, sessionFetcher } from "@/singletons/broadcast-channel";
import { HttpRequestTracker, useHttpRequestStore } from "@/stores/http-request-store";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { resetWebsocketConnection } from "@/singletons/websocket-connection";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { observer } from "mobx-react-lite";

export const UserMenuContainer = observer(() => {
  const mutateHttpState = useHttpRequestStore().mutateState;
  const { dialogStore, gameStore } = AppStore.get();
  const showAuthForm = dialogStore.isOpen(DialogElementName.Credentials);
  const router = useRouter();
  const username = gameStore.getUsernameOption();
  const fetchData = useHttpRequestStore().fetchData;
  const getSessionRequestTrackerName = "get session";
  const responseTracker = useHttpRequestStore().requests[getSessionRequestTrackerName];

  useEffect(() => {
    // always at least check auth status whenever the top bar is mounted
    fetchData(getSessionRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
      method: "GET",
      credentials: "include",
    });

    // this allows us to fetch the session from outside of a react component
    // and still track updates inside components subscribed to this HttpRequestTracker
    sessionFetcher.fromZustand = () =>
      fetchData(
        getSessionRequestTrackerName,
        `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`,
        {
          method: "GET",
          credentials: "include",
        }
      );
  }, []);

  useEffect(() => {
    if (responseTracker && responseTracker.data) {
      const data = responseTracker.data;
      if (typeof data !== "string") {
        gameStore.setUsername(data["username"]);
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
        mutateHttpState((state) => {
          // so we don't see any old error messages
          delete state.requests[HTTP_REQUEST_NAMES.SIGN_UP_WITH_CREDENTIALS];
        });

        if (showAuthForm) {
          dialogStore.highlightAuthForm = true;
          setTimeout(() => {
            dialogStore.highlightAuthForm = false;
          }, 300);
        } else {
          dialogStore.open(DialogElementName.Credentials);
        }
      }}
    >
      LOG IN
    </ButtonBasic>
  );
});

function UserMenu({ username }: { username: null | string }) {
  const mutateHttpState = useHttpRequestStore().mutateState;
  const { dialogStore } = AppStore.get();
  const firstLetterOfUsername = username ? username.charAt(0) : "";
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // on log out
  // send log out to auth server
  // reset socket connection
  // tell other tabs to reset connection
  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
      method: "DELETE",
      credentials: "include",
    });
    getGameWorld().clearFloorTexture();
    mutateHttpState((state) => {
      if (!state.requests[HTTP_REQUEST_NAMES.GET_SESSION])
        state.requests[HTTP_REQUEST_NAMES.GET_SESSION] = new HttpRequestTracker();
      // don't delete the tracker because our auth form and user menu loading spinner
      // state depend on if this request tracke has been created yet
      if (state.requests[HTTP_REQUEST_NAMES.GET_SESSION]) {
        state.requests[HTTP_REQUEST_NAMES.GET_SESSION]!.statusCode = 1;
      }
      delete state.requests[HTTP_REQUEST_NAMES.LOGIN_WITH_CREDENTIALS];
    });

    dialogStore.open(DialogElementName.Credentials);

    AppStore.get().gameStore.clearUsername();

    resetWebsocketConnection();
    // message to have their other tabs reconnect with new cookie
    // to keep socket connections consistent with current authorization
    broadcastChannel.postMessage({ type: TabMessageType.ReconnectSocket });

    setShowUserDropdown(false);
  }

  function closeUserMenu() {
    setShowUserDropdown(false);
  }

  const handleClickOutsideMenu = (e: MouseEvent) => {
    if (userMenuRef.current) {
      const menuRect = userMenuRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) closeUserMenu();
    }
  };

  useEffect(() => {
    window.addEventListener("keyup", closeUserMenu);
    window.addEventListener("click", handleClickOutsideMenu);
    return () => {
      window.removeEventListener("keyup", closeUserMenu);
      window.removeEventListener("click", handleClickOutsideMenu);
    };
  }, []);

  return (
    <div className={`flex flex-col h-fit items-end relative`}>
      <UserMenuToggleButton
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        firstLetterOfUsername={firstLetterOfUsername}
      />

      {showUserDropdown && (
        <div
          className="w-52 absolute border border-slate-400 -top-2 -right-2 pointer-events-none"
          style={{ zIndex: ZIndexLayers.UserMenu }}
          ref={userMenuRef}
        >
          <div className="h-14 flex items-center p-4 mb-[2px]" id="user-menu-spacer">
            <span className="text-lg">User Menu</span>
          </div>
          <div className="bg-slate-700 pointer-events-auto">
            <div className="p-4 text-lg">{username}</div>
            <ul id="user-menu-items" className="pointer-events-auto border-t border-slate-400">
              <UserMenuItem>
                <button
                  className="h-full w-full flex items-center p-4"
                  onClick={() => {
                    setShowUserDropdown(false);
                    const { dialogStore } = AppStore.get();
                    dialogStore.toggle(DialogElementName.AppSettings);
                  }}
                >
                  Settings
                </button>
              </UserMenuItem>
              <UserMenuItem>
                <button
                  className="h-full w-full flex items-center p-4"
                  onClick={() => {
                    router.push(`/profile/${username}?page=1`);
                    setShowUserDropdown(false);
                  }}
                >
                  Profile
                </button>
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

function UserMenuToggleButton({
  setShowUserDropdown,
  showUserDropdown,
  firstLetterOfUsername,
}: {
  setShowUserDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showUserDropdown: boolean;
  firstLetterOfUsername: string;
}) {
  return (
    <button
      type="button"
      id="user-menu-button"
      className={`border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center hover:bg-slate-950`}
      aria-controls="user-menu-items"
      aria-expanded={showUserDropdown}
      aria-label={"toggle user menu"}
      onClick={(_e) => {
        setShowUserDropdown(!showUserDropdown);
      }}
    >
      <span className="text-lg font-bold pointer-events-none">
        {firstLetterOfUsername.toUpperCase()}
      </span>
    </button>
  );
}
