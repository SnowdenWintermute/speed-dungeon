import { useHttpRequestStore } from "@/stores/http-request-store";
import React, { ReactNode, useEffect } from "react";
import { reconnectWebsocketInAllTabs, refetchAuthSessionInAllTabs } from "./auth-utils";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "@/app/components/alerts";

interface Props {
  titleText: string;
  children: ReactNode;
  httpRequestTrackerName: string;
  submitRoute: { url: string; method: string };
  fieldValues: { [fieldName: string]: null | string | boolean };
  nonFieldErrors: string[];
  reauthorizeOnSuccess: boolean;
  successMessage?: string;
  successAlert?: string;
  handleSuccess?: () => void;
}

export default function AuthForm({
  titleText,
  children,
  httpRequestTrackerName,
  submitRoute,
  fieldValues,
  nonFieldErrors,
  reauthorizeOnSuccess,
  successAlert,
  successMessage,
  handleSuccess,
}: Props) {
  const mutateAlertStore = useAlertStore().mutateState;
  const fetchData = useHttpRequestStore().fetchData;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];

  useEffect(() => {
    if (responseTracker?.ok) {
      if (handleSuccess) handleSuccess();
      successAlert && setAlert(mutateAlertStore, successAlert);
      if (reauthorizeOnSuccess) {
        refetchAuthSessionInAllTabs();
        reconnectWebsocketInAllTabs();
      }
    }
  }, [responseTracker?.ok]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetchData(httpRequestTrackerName, submitRoute.url, {
      method: submitRoute.method,
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(fieldValues),
    });
  }

  const nonFieldErrorElements = nonFieldErrors.map((message) => (
    <div className="text-red-500" key={message}>
      {message}
    </div>
  ));

  return (
    <div>
      <h3 className="text-lg mb-3">
        <div className="text-zinc-300">{titleText}</div>
        {responseTracker?.ok && <div className="text-green-600">{successMessage || ""}</div>}
        {!responseTracker?.ok && nonFieldErrorElements}
      </h3>
      <form onSubmit={handleSubmit}>{children}</form>
    </div>
  );
}
