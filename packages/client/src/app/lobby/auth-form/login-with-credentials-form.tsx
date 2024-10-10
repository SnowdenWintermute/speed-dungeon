import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import { useHttpRequestStore } from "@/stores/http-request-store";
import React, { useEffect, useState } from "react";
import { AuthFormTypes } from ".";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { TabMessageType, broadcastChannel } from "@/singletons/broadcast-channel";

interface Props {
  setActiveForm: React.Dispatch<React.SetStateAction<AuthFormTypes>>;
  setNonFieldErrors: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function LoginWithCredentialsForm({ setActiveForm, setNonFieldErrors }: Props) {
  const mutateAlertStore = useAlertStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.LOGIN_WITH_CREDENTIALS;
  const getSessionRequestTrackerName = HTTP_REQUEST_NAMES.GET_SESSION;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const resetSocketConnection = useWebsocketStore().resetConnection;

  useEffect(() => {
    setNonFieldErrors(nonFieldErrors);
  }, [nonFieldErrors]);

  useEffect(() => {
    if (responseTracker?.statusCode === 201) {
      setAlert(mutateAlertStore, "Welcome back!");
      if (!responseTracker.data || typeof responseTracker.data === "string")
        return console.error("expected an object body type");
      if (!responseTracker.data["username"])
        return console.error("expected to get the username in the response body");
      const username = typeof responseTracker.data["username"];
      if (username !== "string") return console.error("expected username to be a string");

      resetSocketConnection();
      // message to have their other tabs reconnect with new cookie
      // to keep socket connections consistent with current authorization
      broadcastChannel.postMessage({ type: TabMessageType.ReconnectSocket });

      fetchData(
        getSessionRequestTrackerName,
        `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      mutateGameStore((state) => {
        state.username = username;
      });
    }
  }, [responseTracker?.statusCode]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fetchData(httpRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
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

      <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
        {responseTracker?.loading ? "..." : "SIGN IN"}
      </ButtonBasic>
      <Divider extraStyles="mb-4 h-[1px] border-0" />
      <ButtonBasic
        buttonType="button"
        extraStyles="w-full mb-3"
        onClick={() => setActiveForm(AuthFormTypes.Registration)}
      >
        CREATE ACCOUNT
      </ButtonBasic>
    </form>
  );
}
