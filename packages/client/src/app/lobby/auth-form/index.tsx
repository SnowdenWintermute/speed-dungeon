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

  async function startGoogleSignIn() {
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

    window.location.href = asJson.requestUri;
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
