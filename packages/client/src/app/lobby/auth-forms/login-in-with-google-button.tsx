import { setAlert } from "@/app/components/alerts";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { useAlertStore } from "@/stores/alert-store";
import React from "react";
import GoogleLogo from "../../../../public/google-logo.svg";

export default function LogInWithGoogleButton({
  setGoogleAuthLoading,
}: {
  setGoogleAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const mutateAlertStore = useAlertStore().mutateState;

  async function startGoogleSignIn() {
    setGoogleAuthLoading(true);
    const requestUriResponse = await fetch("http://localhost:8081/oauth/google", {
      method: "POST",
      credentials: "include",
    });

    const asJson = await requestUriResponse.json();

    if (typeof asJson.requestUri !== "string") {
      return setAlert(
        mutateAlertStore,
        "Couldn't get the google sign in link from the auth server"
      );
    }

    const width = 500;
    const height = 600;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    window.open(
      asJson.requestUri,
      "Google OAuth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  }

  return (
    <ButtonBasic
      buttonType="button"
      extraStyles="w-full justify-start! text-slate-400"
      onClick={startGoogleSignIn}
    >
      <GoogleLogo className="mr-3" /> SIGN IN WITH GOOGLE
    </ButtonBasic>
  );
}