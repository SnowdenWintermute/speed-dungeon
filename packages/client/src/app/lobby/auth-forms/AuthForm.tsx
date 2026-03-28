import React, { ReactNode, useEffect } from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";

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

export const AuthForm = observer(
  ({
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
  }: Props) => {
    const { uiStore, alertsService, broadcastChannel, lobbyClientRef } = useClientApplication();
    const { httpRequests } = uiStore;
    const { fetchData } = httpRequests;
    const responseTracker = httpRequests.requests[httpRequestTrackerName];

    useEffect(() => {
      if (responseTracker?.ok) {
        if (handleSuccess) handleSuccess();
        if (successAlert) alertsService.setAlert(successAlert);
        if (reauthorizeOnSuccess) {
          broadcastChannel.refetchAuthSessionInAllTabs();
          lobbyClientRef.get().resetConnection();
          broadcastChannel.reconnectAllTabs();
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
);
