import React, { Suspense } from "react";
import TopBar from "../../lobby/TopBar";
import GameHistory from "../game-history";
import Divider from "@/app/components/atoms/Divider";
import { TOP_BAR_HEIGHT_REM } from "@/client_consts";
import WinLossRecord from "../win-loss-record";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import ProfileGeneralData from "../profile-general-data";

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

  if (typeof username !== "string") return <div>ERROR: No username provided in url</div>;
  return (
    <div className="flex flex-col h-screen w-screen pointer-events-auto">
      <TopBar />
      <main
        className="p-4 w-full max-w-[64rem] overflow-y-auto flex flex-col mx-auto"
        style={{
          minHeight: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
          maxHeight: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
        }}
      >
        <div className="flex justify-between">
          <h1 className="text-2xl mb-2">{username}'s profile</h1>

          <Suspense
            fallback={
              <div className="h-5 w-5">
                <LoadingSpinner />
              </div>
            }
          >
            <WinLossRecord username={username} />
          </Suspense>
        </div>
        <Divider />
        <div className="flex h-full justify-between">
          <div className="laptop:w-1/2 w-1/3 pt-2 pr-2">
            <ProfileGeneralData username={username} />
          </div>
          <div className="flex-1 h-full pt-2 pl-2">
            <GameHistory username={username} />
          </div>
        </div>
      </main>
    </div>
  );
}
