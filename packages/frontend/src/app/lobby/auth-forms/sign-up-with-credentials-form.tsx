import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import React from "react";
import { AuthFormTypes } from ".";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { HTTP_REQUEST_NAMES, WEBSITE_NAME } from "@/client-consts";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { AuthForm } from "./AuthForm";

interface Props {
  setActiveForm: React.Dispatch<React.SetStateAction<AuthFormTypes>>;
}

export const SignUpWithCredentialsForm = observer(({ setActiveForm }: Props) => {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.SIGN_UP_WITH_CREDENTIALS;

  const { httpRequests, forms } = useClientApplication().uiStore;
  const responseTracker = httpRequests.requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);

  const email = forms.getAuthFormEmailField();
  const setEmail = forms.setAuthFormEmailField;

  return (
    <AuthForm
      titleText="Log in or sign up to save your progress"
      httpRequestTrackerName={httpRequestTrackerName}
      submitRoute={{
        url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/users`,
        method: "POST",
      }}
      fieldValues={{
        email,
        websiteName: WEBSITE_NAME,
        activationPageUrl: `${process.env.NEXT_PUBLIC_BASE_URL + "/account-activation"}`,
      }}
      nonFieldErrors={nonFieldErrors}
      reauthorizeOnSuccess={false}
      successAlert="Success! Check your email for the activation link"
      successMessage="An email has been sent to your address with a link to activate your account. Please allow up to 10 minutes for emails to arrive."
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
        {responseTracker?.loading ? "..." : "CREATE ACCOUNT"}
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={() => setActiveForm(AuthFormTypes.SignIn)}
      >
        SIGN IN
      </ButtonBasic>
    </AuthForm>
  );
});
