import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import SignUpWithCredentialsForm from "./sign-up-with-credentials-form";
import LoginWithCredentialsForm from "./login-with-credentials-form";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { useLobbyStore } from "@/stores/lobby-store";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import LogInWithGoogleButton from "./login-in-with-google-button";

export default function AuthFormContainer() {
  const mutateLobbyState = useLobbyStore().mutateState;
  const highlightAuthForm = useLobbyStore().highlightAuthForm;
  const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    setSuccessMessage("");
  }, [nonFieldErrors]);

  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3.5));
  const borderStyle = highlightAuthForm ? "border-zinc-300" : "border-slate-400";
  return (
    <div
      className={`bg-slate-950 pointer-events-auto border ${borderStyle} relative`}
      style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
    >
      <div className="h-10 w-10 flex justify-end absolute right-0 top-0 border-b border-l border-slate-400">
        <HotkeyButton
          className="p-2"
          hotkey="Escape"
          onClick={() =>
            mutateLobbyState((state) => {
              state.showAuthForm = false;
            })
          }
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
      <h3 className="text-lg mb-3">
        {nonFieldErrors.map((message) => (
          <div className="text-red-500" key={message}>
            {message}
          </div>
        ))}
        {successMessage ? (
          <div className="text-green-600">{successMessage}</div>
        ) : (
          <div>Log in or sign up to save your progress</div>
        )}
      </h3>
      <AuthForms setNonFieldErrors={setNonFieldErrors} setSuccessMessage={setSuccessMessage} />
    </div>
  );
}

// common among auth forms
// - nonFieldErrors
// - success message
// - success alert
// - route method and address
// - on success
//   * reset socket connections accross tabs
//   * fetch active session

export enum AuthFormTypes {
  Registration,
  SignIn,
}

function AuthForms({
  setNonFieldErrors,
  setSuccessMessage,
}: {
  setNonFieldErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [activeForm, setActiveForm] = useState(AuthFormTypes.Registration);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  const formToShow =
    activeForm === AuthFormTypes.Registration ? (
      <SignUpWithCredentialsForm
        setActiveForm={setActiveForm}
        setNonFieldErrors={setNonFieldErrors}
        setSuccessMessage={setSuccessMessage}
      />
    ) : (
      <LoginWithCredentialsForm
        setActiveForm={setActiveForm}
        setNonFieldErrors={setNonFieldErrors}
      />
    );

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
      <LogInWithGoogleButton setGoogleAuthLoading={setGoogleAuthLoading} />
    </div>
  );
}
