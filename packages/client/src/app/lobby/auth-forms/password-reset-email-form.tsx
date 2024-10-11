import React, { SetStateAction, useState } from "react";
import { HTTP_REQUEST_NAMES, WEBSITE_NAME } from "@/client_consts";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useHttpRequestStore } from "@/stores/http-request-store";
import AuthForm from "./AuthForm";
import { AuthFormTypes } from ".";
import { useUIStore } from "@/stores/ui-store";

export default function PasswordResetEmailForm({
  setActiveForm,
}: {
  setActiveForm: React.Dispatch<SetStateAction<AuthFormTypes>>;
}) {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.PASSWORD_RESET_EMAIL;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const email = useUIStore().authFormEmailField;
  const setEmail = useUIStore().setAuthFormEmailField;

  return (
    <AuthForm
      titleText="Enter your email to request a password recovery link"
      httpRequestTrackerName={httpRequestTrackerName}
      submitRoute={{
        url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/credentials`,
        method: "POST",
      }}
      fieldValues={{
        email,
        websiteName: WEBSITE_NAME,
        resetPageUrl: `${process.env.NEXT_PUBLIC_BASE_URL + "/password-reset"}`,
      }}
      nonFieldErrors={nonFieldErrors}
      reauthorizeOnSuccess={false}
      successAlert="Email on the way!"
      successMessage="An email has been sent to your address with a link to reset your password"
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

      <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
        {responseTracker?.loading ? "..." : "GET RESET LINK"}
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-2"
        onClick={() => setActiveForm(AuthFormTypes.Registration)}
      >
        SIGN IN
      </ButtonBasic>
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
