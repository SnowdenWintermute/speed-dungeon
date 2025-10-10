import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useState } from "react";
import SignUpWithCredentialsForm from "./sign-up-with-credentials-form";
import LoginWithCredentialsForm from "./login-with-credentials-form";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import LogInWithGoogleButton from "./login-in-with-google-button";
import PasswordResetEmailForm from "./password-reset-email-form";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { observer } from "mobx-react-lite";

export const AuthFormContainer = observer(() => {
  const { highlightAuthForm } = AppStore.get().dialogStore;

  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3.5));
  const borderStyle = highlightAuthForm ? "border-zinc-300" : "border-slate-400";
  const bgStyle = highlightAuthForm ? "bg-slate-700" : "bg-slate-950";

  return (
    <div
      className={`${bgStyle} pointer-events-auto border ${borderStyle} relative`}
      style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
    >
      <div className="h-10 w-10 flex justify-end absolute right-0 top-0 border-b border-l border-slate-400">
        <HotkeyButton
          className="p-2"
          hotkeys={["Escape"]}
          onClick={() => {
            AppStore.get().dialogStore.close(DialogElementName.Credentials);
          }}
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
      <AuthForms />
    </div>
  );
});

export enum AuthFormTypes {
  Registration,
  SignIn,
  PasswordReset,
}

function AuthForms() {
  const [activeForm, setActiveForm] = useState(AuthFormTypes.Registration);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  const formToShow = (() => {
    switch (activeForm) {
      case AuthFormTypes.Registration:
        return <SignUpWithCredentialsForm setActiveForm={setActiveForm} />;
      case AuthFormTypes.SignIn:
        return <LoginWithCredentialsForm setActiveForm={setActiveForm} />;
      case AuthFormTypes.PasswordReset:
        return <PasswordResetEmailForm setActiveForm={setActiveForm} />;
    }
  })();

  if (googleAuthLoading)
    return (
      <div className="flex flex-col">
        <div className="h-20 w-20 mt-6 mb-6 self-center">
          <LoadingSpinner />
        </div>
        <p className="mb-2">
          {" "}
          Authenticating with Google. Please choose your Google account in the newly opened window.
          If you have blocked pop ups you may need to allow them.
        </p>
        <ButtonBasic
          extraStyles="w-full"
          onClick={() => {
            setGoogleAuthLoading(false);
          }}
        >
          TRY ANOTHER METHOD
        </ButtonBasic>
      </div>
    );

  return (
    <div>
      {formToShow}
      {activeForm !== AuthFormTypes.PasswordReset && (
        <LogInWithGoogleButton setGoogleAuthLoading={setGoogleAuthLoading} />
      )}
    </div>
  );
}
