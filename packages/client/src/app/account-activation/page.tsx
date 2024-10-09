"use client";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { setAlert } from "../components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import LabeledTextInputWithErrorDisplay from "../components/molocules/LabeledInputWithErrorDisplay";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import WithTopBar from "../components/layouts/with-top-bar";
import { TabMessageType, useBroadcastChannelStore } from "@/stores/broadcast-channel-store";

export default function AccountActivation() {
  const fetchData = useHttpRequestStore().fetchData;
  const mutateAlertStore = useAlertStore().mutateState;
  const mutateBroadcastState = useBroadcastChannelStore().mutateState;
  const httpRequestTrackerName = "activate account";
  const getSessionRequestTrackerName = "get session";
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const existingUsernameOption = searchParams.get("existing_username_option");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);

  useEffect(() => {
    console.log("responseTracker?.statusCode", responseTracker?.statusCode);
    if (responseTracker?.statusCode === 201) {
      setSuccessMessage("Success!");
      setAlert(mutateAlertStore, "Account activated!");

      mutateBroadcastState((state) => {
        // message to have their other tabs reconnect with new cookie
        // to keep socket connections consistent with current authorization
        state.channel.postMessage({ type: TabMessageType.ReconnectSocket });
      });

      fetchData(
        getSessionRequestTrackerName,
        `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      router.push("/");
    }
  }, [responseTracker?.statusCode]);

  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));
  // PUT authServerUrl /users // token, username, password, passwordConfirm
  const url = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/users`;
  return (
    <WithTopBar>
      <div className="flex mt-20 justify-center items-start text-zinc-300 pointer-events-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchData(httpRequestTrackerName, url, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                token,
                username: existingUsernameOption || username,
                password,
                passwordConfirm,
              }),
            });
          }}
          className="bg-slate-950 text-slate-400"
          style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
        >
          <div>
            <h3 className="text-lg mb-3">
              {nonFieldErrors.map((message) => (
                <div className="text-red-500" key={message}>
                  {message}
                </div>
              ))}
              {successMessage ? (
                <div className="text-green-600">{successMessage}</div>
              ) : (
                <div className="text-zinc-300">Finish setting up your account for {email}</div>
              )}
            </h3>
          </div>
          <LabeledTextInputWithErrorDisplay
            name={"username"}
            type={"text"}
            label={"Username"}
            placeholder={"Username..."}
            value={existingUsernameOption || username}
            onChange={(e) => {
              setUsername(e.target.value);
              setFieldErrors({ ...fieldErrors, password: "" });
            }}
            disabled={!!existingUsernameOption}
            error={fieldErrors["username"]}
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
          <LabeledTextInputWithErrorDisplay
            name={"password"}
            type={"password"}
            label={"Password"}
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
        </form>
      </div>
    </WithTopBar>
  );
}
