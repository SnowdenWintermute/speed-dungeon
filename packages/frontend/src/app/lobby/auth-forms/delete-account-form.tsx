import React, { useId, useState } from "react";
import { AuthForm } from "./AuthForm";
import { HTTP_REQUEST_NAMES } from "@/client-consts";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import { Checkbox } from "@speed-dungeon/ui/atoms/Checkbox";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";

const CONFIRM_DELETION_LABEL = "Check the box to confirm your intent to delete your account";

export const DeleteAccountForm = observer(() => {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.DELETE_ACCOUNT;
  const { httpRequests } = useClientApplication().uiStore;
  const responseTracker = httpRequests.requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const confirmDeletionId = useId();

  return (
    <AuthForm
      titleText="Delete your account permenantly"
      httpRequestTrackerName={httpRequestTrackerName}
      submitRoute={{
        url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/users`,
        method: "DELETE",
      }}
      fieldValues={{
        confirmDeletion,
      }}
      nonFieldErrors={nonFieldErrors}
      reauthorizeOnSuccess={true}
      successAlert="Account deleted"
      successMessage="Your account has been deleted"
    >
      <div className="flex justify-between align-middle text-red-500 mb-2">
        <label htmlFor={confirmDeletionId} className="cursor-pointer">
          {CONFIRM_DELETION_LABEL}
        </label>
        <Checkbox
          id={confirmDeletionId}
          ariaLabel={CONFIRM_DELETION_LABEL}
          checked={confirmDeletion}
          setChecked={setConfirmDeletion}
        />
      </div>
      <ButtonBasic
        buttonType="submit"
        extraStyles={`w-full mb-4 ${confirmDeletion && "bg-red-800"}`}
        disabled={!confirmDeletion}
      >
        {confirmDeletion && "!!! "}
        {responseTracker?.loading ? "..." : "DELETE ACCOUNT"}
        {confirmDeletion && " !!!"}
      </ButtonBasic>
    </AuthForm>
  );
});
