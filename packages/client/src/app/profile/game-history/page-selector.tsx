import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import {
  NextOrPrevious,
  RACE_GAME_RECORDS_PAGE_SIZE,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import ArrowShape from "../../../../public/img/menu-icons/arrow-button-icon.svg";

export default function PageSelector({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page") || "1";
  const page = parseInt(pageParam);
  const pathname = usePathname();
  const { replace } = useRouter();
  const numRecordsHttpRequestTrackerName = HTTP_REQUEST_NAMES.GET_USER_NUM_GAMES_PLAYED;
  const numGamesResponseTracker = useHttpRequestStore().requests[numRecordsHttpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;

  useEffect(() => {
    fetchData(
      numRecordsHttpRequestTrackerName,
      `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game-records/count/${username}`,
      {
        method: "GET",
        headers: { "content-type": "application/json" },
      }
    );
  }, []);

  const numRecords =
    typeof numGamesResponseTracker?.data === "number" ? numGamesResponseTracker?.data : 0;
  const numPages = Math.ceil(numRecords / RACE_GAME_RECORDS_PAGE_SIZE);

  function setNewPage(direction: NextOrPrevious) {
    const params = new URLSearchParams(searchParams);
    const newPage = getNextOrPreviousNumber(page, numPages, direction);
    params.set("page", newPage.toString());
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full flex justify-center">
      <div className="flex pointer-events-auto items-center">
        <HotkeyButton
          hotkeys={["KeyW"]}
          className="h-10 p-2 border border-slate-400 flex justify-center items-center w-10"
          onClick={() => {
            setNewPage(NextOrPrevious.Previous);
          }}
        >
          <ArrowShape className="h-full fill-slate-400" />
        </HotkeyButton>
        {
          <div className="text-lg mr-4 ml-4">
            Page {page}/{numPages}
          </div>
        }
        <HotkeyButton
          hotkeys={["KeyE"]}
          className="h-10 p-2 border border-slate-400 flex justify-center items-center w-10"
          onClick={() => {
            setNewPage(NextOrPrevious.Next);
          }}
        >
          <ArrowShape className="h-full fill-slate-400 rotate-180" />
        </HotkeyButton>
      </div>
    </div>
  );
}
