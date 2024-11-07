"use client";
import React from "react";
import TopBar from "../../lobby/TopBar";
import GameHistory from "../game-history";

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-screen w-screen">
      <TopBar />
      <GameHistory />
    </div>
  );
}
