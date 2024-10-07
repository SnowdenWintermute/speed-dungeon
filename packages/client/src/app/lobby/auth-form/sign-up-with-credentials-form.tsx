import { setAlert } from "@/app/components/alerts";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { useAlertStore } from "@/stores/alert-store";
import { useHttpRequestStore } from "@/stores/http-request-store";
import React, { useEffect, useState } from "react";
import { AuthForms } from ".";
import useFormFieldErrors from "@/hooks/use-form-field-errors";

interface Props {
  setActiveForm: React.Dispatch<React.SetStateAction<AuthForms>>;
}

export default function SignUpWithCredentialsForm({ setActiveForm }: Props) {
  const mutateAlertStore = useAlertStore().mutateState;
  const httpRequestTrackerName = "sign up with credentials";
  const registrationResponseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;
  const [email, setEmail] = useState("");
  // const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [fieldErrors, setFieldErrors] = useFormFieldErrors(registrationResponseTracker);

  // useEffect(() => {
  //   const newFieldErrors: { [key: string]: string } = {};
  //   if (!registrationResponseTracker?.errors) return;
  //   registrationResponseTracker.errors.map((error) => {
  //     if (!error.field) {
  //       setAlert(mutateAlertStore, error.message);
  //     } else {
  //       newFieldErrors[error.field] = error.message;
  //     }
  //   });
  //   setFieldErrors(newFieldErrors);
  // }, [registrationResponseTracker?.errors]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fetchData(httpRequestTrackerName, "http://localhost:8081/users", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            websiteName: "Speed Dungeon",
            activationPageUrl: `${process.env.BASE_URL + "/account-activation"}`,
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
        disabled={registrationResponseTracker?.loading}
        error={fieldErrors["email"]}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />
      <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
        {registrationResponseTracker?.loading ? "..." : "CREATE ACCOUNT"}
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={() => setActiveForm(AuthForms.SignIn)}
      >
        SIGN IN
      </ButtonBasic>
    </form>
  );
}

// <LabeledTextInputWithErrorDisplay
//   name={"password"}
//   type={"password"}
//   label={"Password"}
//   placeholder={"A strong password..."}
//   value={password}
//   onChange={(e) => {
//     setPassword(e.target.value);
//     setFieldErrors({ ...fieldErrors, password: "" });
//   }}
//   disabled={false}
//   error={fieldErrors["password"]}
//   extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
// />
