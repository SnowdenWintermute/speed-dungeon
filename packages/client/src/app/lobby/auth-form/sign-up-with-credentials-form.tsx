import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { useHttpRequestStore } from "@/stores/http-request-store";
import React, { useEffect, useState } from "react";
import { AuthFormTypes } from ".";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "@/app/components/alerts";

interface Props {
  setActiveForm: React.Dispatch<React.SetStateAction<AuthFormTypes>>;
  setNonFieldErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function SignUpWithCredentialsForm({
  setActiveForm,
  setNonFieldErrors,
  setSuccessMessage,
}: Props) {
  const mutateAlertStore = useAlertStore().mutateState;
  const httpRequestTrackerName = "sign up with credentials";
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);

  useEffect(() => {
    setNonFieldErrors(nonFieldErrors);
  }, [nonFieldErrors]);

  useEffect(() => {
    console.log("responseTracker?.statusCode", responseTracker?.statusCode);
    if (responseTracker?.statusCode === 201) {
      setSuccessMessage(
        "An email has been sent to your address with a link to activate your account"
      );
      setAlert(mutateAlertStore, "Success! Check your email for the activation link");
    }
  }, [responseTracker?.statusCode]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fetchData(httpRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/users`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            websiteName: "Speed Dungeon",
            activationPageUrl: `${process.env.NEXT_PUBLIC_BASE_URL + "/account-activation"}`,
          }),
        });
      }}
      className="text-slate-400"
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
    </form>
  );
}
