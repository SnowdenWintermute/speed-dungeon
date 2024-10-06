import { SPACING_REM_LARGE } from "@/client_consts";
import { BASE_SCREEN_SIZE, GOLDEN_RATIO } from "@speed-dungeon/common";
import React, { useState } from "react";

export default function AuthForm() {
  const authFormWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 4));
  return (
    <div
      className="bg-slate-950 pointer-events-auto"
      style={{ padding: `${SPACING_REM_LARGE}rem`, width: `${authFormWidth}px` }}
    >
      <h3 className="mb-2">Log in or sign up to save your progress</h3>
      <RegistrationForm />
    </div>
  );
}

function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  return (
    <form>
      <input
        className="bg-transparent border border-slate-400 h-10 p-4 w-full"
        type="text"
        name="email"
        placeholder="Email address..."
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
    </form>
  );
}
