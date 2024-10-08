import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import GoogleLogo from "../../../../public/google-logo.svg";
import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import SignUpWithCredentialsForm from "./sign-up-with-credentials-form";
import LoginWithCredentialsForm from "./login-with-credentials-form";

export default function AuthForm() {
  const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    setSuccessMessage("");
  }, [nonFieldErrors]);

  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3.5));
  return (
    <div
      className="bg-slate-950 pointer-events-auto border border-slate-400"
      style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
    >
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
  const mutateAlertStore = useAlertStore().mutateState;
  const [activeForm, setActiveForm] = useState(AuthFormTypes.Registration);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  function handleGoogleSignInWindowMessage(event: any) {
    if (event.origin !== "http://localhost:3000") return;
    if (event.data.googleSignInResult) {
      console.log("event.data.googleSignInResult: ", event.data.googleSignInResult);
      setGoogleAuthLoading(false);
    }
  }

  useEffect(() => {
    window.addEventListener("message", handleGoogleSignInWindowMessage);

    return () => {
      window.removeEventListener("message", handleGoogleSignInWindowMessage);
    };
  }, []);

  async function startGoogleSignIn() {
    setGoogleAuthLoading(true);
    const requestUriResponse = await fetch("http://localhost:8081/oauth/google", {
      method: "POST",
      credentials: "include",
    });

    const asJson = await requestUriResponse.json();

    if (typeof asJson.requestUri !== "string") {
      return setAlert(
        mutateAlertStore,
        "Couldn't get the google sign in link from the auth server"
      );
    }

    const width = 500;
    const height = 600;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    const authWindow = window.open(
      asJson.requestUri,
      "Google OAuth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  }

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
      <div>
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
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full justify-start! text-slate-400"
        onClick={startGoogleSignIn}
      >
        <GoogleLogo className="mr-3" /> SIGN IN WITH GOOGLE
      </ButtonBasic>
    </div>
  );
}
