import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { useHttpRequestStore } from "@/stores/http-request-store";
import React, { useState } from "react";
import { AuthFormTypes } from ".";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import AuthForm from "./AuthForm";
import { useUIStore } from "@/stores/ui-store";
import { gameWorld } from "@/app/3d-world/SceneManager";

interface Props {
  setActiveForm: React.Dispatch<React.SetStateAction<AuthFormTypes>>;
}

export default function LoginWithCredentialsForm({ setActiveForm }: Props) {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.LOGIN_WITH_CREDENTIALS;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const email = useUIStore().authFormEmailField;
  const setEmail = useUIStore().setAuthFormEmailField;
  const [password, setPassword] = useState("");

  return (
    <AuthForm
      titleText="Log in or sign up to save your progress"
      httpRequestTrackerName={httpRequestTrackerName}
      submitRoute={{
        url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`,
        method: "POST",
      }}
      fieldValues={{
        email,
        password,
      }}
      nonFieldErrors={nonFieldErrors}
      reauthorizeOnSuccess={true}
      successAlert="Welcome back!"
      handleSuccess={() => gameWorld.current?.drawCharacterSlots()}
    >
      <LabeledTextInputWithErrorDisplay
        name={"email"}
        type={"email"}
        label={"Email Address"}
        placeholder={"Email address..."}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setFieldErrors({ ...fieldErrors, email: "" });
        }}
        disabled={responseTracker?.loading}
        error={fieldErrors["email"]}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />

      <LabeledTextInputWithErrorDisplay
        name={"password"}
        type={"password"}
        label={"Password"}
        placeholder={"Password..."}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setFieldErrors({ ...fieldErrors, password: "" });
        }}
        disabled={responseTracker?.loading}
        error={fieldErrors["password"]}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />

      <ButtonBasic buttonType="submit" extraStyles="w-full mb-2">
        {responseTracker?.loading ? "..." : "SIGN IN"}
      </ButtonBasic>

      <div className="mb-3">
        <button onClick={() => setActiveForm(AuthFormTypes.PasswordReset)}>Reset password</button>
      </div>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={() => setActiveForm(AuthFormTypes.Registration)}
      >
        CREATE ACCOUNT
      </ButtonBasic>
    </AuthForm>
  );
}
