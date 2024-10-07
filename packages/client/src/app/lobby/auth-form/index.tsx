import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useState } from "react";
import GoogleLogo from "../../../../public/google-logo.svg";
import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";

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

function RegistrationForm() {
  const mutateAlertStore = useAlertStore().mutateState;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // HTTP fetcher element
  // set loading
  // set error
  // set data
  // provide fetch function

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="text-slate-400"
    >
      <LabeledTextInputWithErrorDisplay
        name={"email"}
        type={"email"}
        label={"Email Address"}
        placeholder={"Email address..."}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={false}
        autofocus={false}
        error={""}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />
      <LabeledTextInputWithErrorDisplay
        name={"password"}
        type={"password"}
        label={"Password"}
        placeholder={"A strong password..."}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={false}
        autofocus={false}
        error={""}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />
      <LabeledTextInputWithErrorDisplay
        name={"password confirm"}
        type={"password"}
        label={"Confirm Password"}
        placeholder={"Confirm password..."}
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        disabled={false}
        autofocus={false}
        error={""}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-3"
      />
      <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
        CREATE ACCOUNT
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={async () => {
          try {
            const res = await fetch("http://localhost:8081/sessions", {
              method: "POST",
              credentials: "include",
              body: JSON.stringify({
                email: "m",
                password: "o",
              }),
            });

            const asJson = await res.json();
            console.log(asJson);
          } catch (err) {
            console.log(err);
          }
        }}
      >
        SIGN IN
      </ButtonBasic>
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full justify-start!"
        onClick={startGoogleSignIn}
      >
        <GoogleLogo className="mr-3" /> SIGN IN WITH GOOGLE
      </ButtonBasic>
    </form>
  );
}
