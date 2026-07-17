"use client";
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { HTTP_REQUEST_NAMES } from "@/client-consts";
import { PasswordResetEmailForm } from "@/app/lobby/auth-forms/password-reset-email-form";
import { DeleteAccountForm } from "@/app/lobby/auth-forms/delete-account-form";
import { ChangeUsernameForm } from "@/app/lobby/auth-forms/change-username-form";
import Divider from "@/app/components/atoms/Divider";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const AccountSection = observer(() => {
  const clientApplication = useClientApplication();
  const { session } = clientApplication;
  const { httpRequests } = clientApplication.uiStore;
  const { usernameOption } = session;

  useEffect(() => {
    httpRequests.clearRequestTracker(HTTP_REQUEST_NAMES.DELETE_ACCOUNT);
    httpRequests.clearRequestTracker(HTTP_REQUEST_NAMES.CHANGE_USERNAME);
    httpRequests.clearRequestTracker(HTTP_REQUEST_NAMES.PASSWORD_RESET_EMAIL);
  }, [httpRequests]);

  return (
    <div className="flex flex-col">
      <h3 className="self-end">
        Logged in as <span className="italic">{usernameOption}</span>
      </h3>
      <Divider />
      <div style={{ width: `450px` }}>
        <PasswordResetEmailForm />
        <Divider />
      </div>
      <div style={{ width: `450px` }}>
        <DeleteAccountForm />
        <Divider />
      </div>
      <div style={{ width: `450px` }}>
        <ChangeUsernameForm />
      </div>
    </div>
  );
});
