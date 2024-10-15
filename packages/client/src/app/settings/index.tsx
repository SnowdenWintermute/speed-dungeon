import { HTTP_REQUEST_NAMES, SPACING_REM_SMALL } from "@/client_consts";
import React, { useEffect } from "react";
import HotkeyButton from "../components/atoms/HotkeyButton";
import XShape from "../../../public/img/basic-shapes/x-shape.svg";
import { useUIStore } from "@/stores/ui-store";
import PasswordResetEmailForm from "../lobby/auth-forms/password-reset-email-form";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useGameStore } from "@/stores/game-store";
import Divider from "../components/atoms/Divider";
import DeleteAccountForm from "../lobby/auth-forms/delete-account-form";
import ChangeUsernameForm from "../lobby/auth-forms/change-username-form";

export default function Settings() {
  const mutateUIState = useUIStore().mutateState;
  const mutateHttpRequestState = useHttpRequestStore().mutateState;
  const username = useGameStore().username;
  const showSettings = useUIStore().showSettings;

  useEffect(() => {
    mutateHttpRequestState((state) => {
      delete state.requests[HTTP_REQUEST_NAMES.DELETE_ACCOUNT];
      delete state.requests[HTTP_REQUEST_NAMES.CHANGE_USERNAME];
      delete state.requests[HTTP_REQUEST_NAMES.PASSWORD_RESET_EMAIL];
    });
  }, [showSettings]);

  if (!showSettings) return <></>;

  return (
    <section
      aria-label="settings menu"
      className="absolute h-full w-full z-30 bg-slate-700 pointer-events-auto"
    >
      <div
        className="h-10 w-full border-b border-slate-400 flex items-center justify-between"
        style={{ paddingLeft: `${SPACING_REM_SMALL}rem` }}
      >
        <h2 className="text-lg">Settings</h2>
        <HotkeyButton
          className="p-2 h-full w-fit border cursor-pointer"
          hotkeys={["Escape"]}
          ariaLabel="close settings window"
          onClick={() => {
            mutateUIState((state) => {
              state.showSettings = false;
            });

            mutateHttpRequestState((state) => {
              delete state.requests[HTTP_REQUEST_NAMES.PASSWORD_RESET_EMAIL];
            });
          }}
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
      <div className="flex flex-col" style={{ padding: `${SPACING_REM_SMALL}rem` }}>
        <h3 className="self-end">
          Logged in as <span className="italic">{username}</span>
        </h3>
        <Divider />
        <div style={{ width: `450px` }}>
          <PasswordResetEmailForm />
          <Divider />
        </div>
        <div style={{ width: `450px` }}>
          <DeleteAccountForm />
          <Divider />
        </div>
        <div style={{ width: `450px` }}>
          <ChangeUsernameForm />
        </div>
      </div>
    </section>
  );
}

// function PasswordResetEmailForm
