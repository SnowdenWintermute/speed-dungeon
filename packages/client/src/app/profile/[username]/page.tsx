"use client";
import React from "react";
import TopBar from "../../lobby/TopBar";
import GameHistory from "../game-history";
import { useParams } from "next/navigation";
import Divider from "@/app/components/atoms/Divider";
import { TOP_BAR_HEIGHT_REM } from "@/client_consts";

export default function ProfilePage() {
  const params = useParams();
  const { username } = params;

  if (typeof username !== "string") return <div>ERROR: No username provided in url</div>;
  return (
    <div className="flex flex-col h-screen w-screen pointer-events-auto">
      <TopBar />
      <main
        className="p-4 w-full overflow-y-auto"
        style={{
          minHeight: `calc(100% ${TOP_BAR_HEIGHT_REM}rem)`,
          maxHeight: `calc(100% ${TOP_BAR_HEIGHT_REM}rem)`,
        }}
      >
        <h1 className="text-2xl mb-2">{username}'s profile</h1>
        <Divider />
        <GameHistory />
      </main>
    </div>
  );
}
