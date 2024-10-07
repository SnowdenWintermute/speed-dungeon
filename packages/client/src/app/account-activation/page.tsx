"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function AccountActivation() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const existingUsernameOption = searchParams.get("existing_username_option");
  const router = useRouter();

  return (
    <div>
      email: {email}
      token: {token} existingUsernameOption: {existingUsernameOption}
    </div>
  );
}
