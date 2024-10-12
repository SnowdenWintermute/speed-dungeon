"use client";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import LabeledTextInputWithErrorDisplay from "../components/molocules/LabeledInputWithErrorDisplay";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { HTTP_REQUEST_NAMES, SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import WithTopBar from "../components/layouts/with-top-bar";
import AuthForm from "../lobby/auth-forms/AuthForm";

export default function PasswordResetPage() {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.CHANGE_PASSWORD;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);

  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));

  return (
    <WithTopBar>
      <div className="flex mt-20 justify-center items-start text-zinc-300 pointer-events-auto">
        <div
          className="bg-slate-950 text-slate-400"
          style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
        >
          <AuthForm
            titleText={`Enter your new password`}
            httpRequestTrackerName={httpRequestTrackerName}
            submitRoute={{
              url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/credentials`,
              method: "PUT",
            }}
            fieldValues={{
              token,
              password,
              passwordConfirm,
            }}
            nonFieldErrors={nonFieldErrors}
            reauthorizeOnSuccess={true}
            successAlert="Success!"
            successMessage="Password changed! You may now log in with your new password."
          >
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
            <LabeledTextInputWithErrorDisplay
              name={"password"}
              type={"password"}
              label={"Confirm Password"}
              placeholder={"Confirm password..."}
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setFieldErrors({ ...fieldErrors, passwordConfirm: "" });
              }}
              disabled={responseTracker?.loading}
              error={fieldErrors["passwordConfirm"]}
              extraStyles="text-slate-400 placeholder:opacity-50 mb-4"
            />

            <ButtonBasic buttonType="submit" extraStyles="w-full">
              {responseTracker?.loading ? "..." : "SUBMIT"}
            </ButtonBasic>
          </AuthForm>
        </div>
      </div>
    </WithTopBar>
  );
}
