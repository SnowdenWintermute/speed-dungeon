import React, { useState } from "react";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import LabeledTextInputWithErrorDisplay from "@/app/components/molocules/LabeledInputWithErrorDisplay";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import useHttpResponseErrors from "@/hooks/use-http-response-errors";
import { useHttpRequestStore } from "@/stores/http-request-store";
import AuthForm from "./AuthForm";

export default function ChangeUsernameForm() {
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.CHANGE_USERNAME;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const [fieldErrors, setFieldErrors, nonFieldErrors] = useHttpResponseErrors(responseTracker);
  const [newUsername, setNewUsername] = useState("");

  return (
    <>
      <div className="text-lg text-yellow-500">
        WARNING: changing your username will reset your connection. Doing so mid-game will forfeit
        your game's current progress.
      </div>
      <AuthForm
        titleText="Enter a new username"
        httpRequestTrackerName={httpRequestTrackerName}
        submitRoute={{
          url: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/users/usernames`,
          method: "PUT",
        }}
        fieldValues={{
          newUsername,
        }}
        nonFieldErrors={nonFieldErrors}
        reauthorizeOnSuccess={true}
        successAlert="Username updated"
        successMessage="Username has been changed"
      >
        <LabeledTextInputWithErrorDisplay
          name={"username"}
          type={"text"}
          label={"Username"}
          placeholder={"Your new username..."}
          value={newUsername}
          onChange={(e) => {
            setNewUsername(e.target.value);
            setFieldErrors({ ...fieldErrors, newUsername: "" });
          }}
          disabled={responseTracker?.loading}
          error={fieldErrors["newUsername"]}
          extraStyles="text-slate-400 placeholder:opacity-50 mb-2"
          autoComplete={"off"}
        />

        <ButtonBasic buttonType="submit" extraStyles="w-full mb-4">
          {responseTracker?.loading ? "..." : "CHANGE USERNAME"}
        </ButtonBasic>
      </AuthForm>
    </>
  );
}
