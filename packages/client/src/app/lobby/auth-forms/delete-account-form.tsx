import React, { useState } from "react";
import AuthForm from "./AuthForm";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";

export default function DeleteAccountForm() {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.DELETE_ACCOUNT;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const [confirmDeletion, setConfirmDeletion] = useState(false);

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
      <div className="flex justify-between align-middle text-lg mb-2">
        <span>Check the box to confirm your intent to delete your account</span>
        <button
          className="h-10 w-10 p-2 border border-slate-400 hover:bg-slate-950"
          type="button"
          onClick={() => {
            setConfirmDeletion(!confirmDeletion);
          }}
        >
          {confirmDeletion && <XShape className="fill-white" />}
        </button>
      </div>
      <ButtonBasic
        buttonType="submit"
        extraStyles={`w-full mb-4 ${confirmDeletion && "bg-red-800"}`}
        disabled={!confirmDeletion}
      >
        {responseTracker?.loading ? "..." : "DELETE ACCOUNT"}
      </ButtonBasic>
    </AuthForm>
  );
}
