import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useState } from "react";
import GoogleLogo from "../../../../public/google-logo.svg";
import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { useHttpRequestStore } from "@/stores/http-request-store";
import SignUpWithCredentialsForm from "./sign-up-with-credentials-form";
import LoginWithCredentialsForm from "./login-with-credentials-form";

export default function AuthForm() {
  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3.5));
  return (
    <div
      className="bg-slate-950 pointer-events-auto"
      style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
    >
      <h3 className="text-lg mb-3">Log in or sign up to save your progress</h3>
      <RegistrationForm />
    </div>
  );
}

export enum AuthForms {
  Registration,
  SignIn,
}

function RegistrationForm() {
  const mutateAlertStore = useAlertStore().mutateState;
  const [activeForm, setActiveForm] = useState(AuthForms.Registration);

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
    activeForm === AuthForms.Registration ? (
      <SignUpWithCredentialsForm setActiveForm={setActiveForm} />
    ) : (
      <LoginWithCredentialsForm setActiveForm={setActiveForm} />
    );

  return (
    <div>
      {formToShow}
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full justify-start!"
        onClick={startGoogleSignIn}
      >
        <GoogleLogo className="mr-3" /> SIGN IN WITH GOOGLE
      </ButtonBasic>
    </div>
  );
}
