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

export default function LoginWithCredentialsForm({ setActiveForm }: Props) {
  const httpRequestTrackerName = "login with credentials";
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useFormFieldErrors(responseTracker);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fetchData(httpRequestTrackerName, "http://localhost:8081/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
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

      <LabeledTextInputWithErrorDisplay
        name={"password"}
        type={"password"}
        label={"Password"}
        placeholder={"A strong password..."}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setFieldErrors({ ...fieldErrors, password: "" });
        }}
        disabled={responseTracker?.loading}
        error={fieldErrors["password"]}
        extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
      />

      <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
        {responseTracker?.loading ? "..." : "SIGN IN"}
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={() => setActiveForm(AuthForms.Registration)}
      >
        CREATE ACCOUNT
      </ButtonBasic>
    </form>
  );
}
