import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import React from "react";

export default function GameSetupMenu() {
  return (
    <section className="w-full bg-slate-700 border border-slate-400 p-4 mb-4 flex justify-between pointer-events-auto">
      <ButtonBasic onClick={leave_game}>{"Leave Game"}</ButtonBasic>
      <ButtonBasic onClick={toggle_ready}>{"Ready"}</ButtonBasic>
    </section>
  );
}
