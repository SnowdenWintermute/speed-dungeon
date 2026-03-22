"use client";
import { useRouter } from "next/navigation";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { ZIndexLayers } from "@/app/z-index-layers";
import { HTTP_REQUEST_NAMES } from "@/client-consts";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { HttpRequestTracker } from "@/client-application/ui/http-requests";

export const UserMenuContainer = observer(() => {
  const clientApplication = useClientApplication();
  const { dialogs, httpRequests } = clientApplication.uiStore;
  const showAuthForm = dialogs.isOpen(DialogElementName.Credentials);
  const router = useRouter();
  const getSessionRequestTrackerName = "get session";
  const responseTracker = httpRequests.requests[getSessionRequestTrackerName];

  useEffect(() => {
    // always at least check auth status whenever the top bar is mounted
    httpRequests.fetchAuthSession();
  }, [httpRequests]);

  const { session } = clientApplication;
  const { usernameOption } = session;

  useEffect(() => {
    if (responseTracker && responseTracker.data) {
      const data = responseTracker.data;
      if (typeof data !== "string") {
        session.setUsername(data["username"]);
      }
    }
  }, [responseTracker?.data]);

  function flashHighlightAuthForm() {
    dialogs.highlightAuthForm = true;
    setTimeout(() => {
      dialogs.highlightAuthForm = false;
    }, 300);
  }

  return !responseTracker || responseTracker?.loading ? (
    <div className="h-10 w-10">
      <LoadingSpinner />
    </div>
  ) : responseTracker?.statusCode === 200 && usernameOption ? (
    <UserMenu username={usernameOption} />
  ) : (
    <ButtonBasic
      onClick={() => {
        router.push("/");
        // so we don't see any old error messages
        httpRequests.clearRequestTracker(HTTP_REQUEST_NAMES.SIGN_UP_WITH_CREDENTIALS);

        if (showAuthForm) {
          flashHighlightAuthForm();
        } else {
          dialogs.open(DialogElementName.Credentials);
        }
      }}
    >
      LOG IN
    </ButtonBasic>
  );
});

function UserMenu({ username }: { username: null | string }) {
  const clientApplication = useClientApplication();
  const { dialogs, httpRequests } = clientApplication.uiStore;
  const { session, lobbyClientRef, broadcastChannel } = clientApplication;
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
    clientApplication.gameWorldView?.environment.groundPlane.clear();

    if (!httpRequests.requests[HTTP_REQUEST_NAMES.GET_SESSION]) {
      httpRequests.requests[HTTP_REQUEST_NAMES.GET_SESSION] = new HttpRequestTracker();
    }
    // don't delete the tracker because our auth form and user menu loading spinner
    // state depend on if this request tracker has been created yet
    const existingLoginRequestTracker = httpRequests.requests[HTTP_REQUEST_NAMES.GET_SESSION];
    if (existingLoginRequestTracker) {
      existingLoginRequestTracker.statusCode = 1;
    }
    delete httpRequests.requests[HTTP_REQUEST_NAMES.LOGIN_WITH_CREDENTIALS];

    dialogs.open(DialogElementName.Credentials);

    session.clearUsername();

    lobbyClientRef.get().resetConnection();

    // to keep open connections across tabs consistent with current authorization
    broadcastChannel.reconnectAllTabs();

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
                    dialogs.toggle(DialogElementName.AppSettings);
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
