import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import PageSelector from "./page-selector";
import { CustomErrorDetails, RaceGameAggregatedRecord } from "@speed-dungeon/common";

export default function GameHistory() {
  const searchParams = useSearchParams();
  const params = useParams();
  const { username } = params;
  if (typeof username !== "string") return <div>ERROR: No username provided in url</div>;
  const pageParam = searchParams.get("page") || "1";
  const page = parseInt(pageParam);
  const httpRequestTrackerName = HTTP_REQUEST_NAMES.GET_USER_GAME_HISTORY;
  const responseTracker = useHttpRequestStore().requests[httpRequestTrackerName];
  const fetchData = useHttpRequestStore().fetchData;

  useEffect(() => {
    fetchData(
      httpRequestTrackerName,
      `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game-records/${username}?page=${page}`,
      {
        method: "GET",
        headers: { "content-type": "application/json" },
      }
    );
  }, [page]);

  const errorsOption = !responseTracker?.ok && (responseTracker?.data as CustomErrorDetails[]);

  const data = responseTracker?.ok && (responseTracker?.data as RaceGameAggregatedRecord[]);

  console.log(JSON.stringify(data, null, 2));

  return (
    <div className="w-full">
      <h3 className="text-xl">Game History</h3>
      {responseTracker?.loading && (
        <div className="h-10 w-10">
          <LoadingSpinner />
        </div>
      )}
      {errorsOption && (
        <div>
          ERROR:{" "}
          {errorsOption.map((item) => (
            <div key={item.message}>{item.message}</div>
          ))}
        </div>
      )}
      <ul>{data && data.map((item) => <GameRecordCard key={item.game_id} gameRecord={item} />)}</ul>

      <PageSelector username={username} />
    </div>
  );
}

function GameRecordCard({ gameRecord }: { gameRecord: RaceGameAggregatedRecord }) {
  return (
    <li className="border border-slate-400">
      <div className="flex justify-between">
        <h5 className="text-lg">{gameRecord.game_name}</h5>
        <p>
          {gameRecord.time_of_completion
            ? new Date(gameRecord.time_of_completion).toLocaleString()
            : "Pending"}
        </p>
      </div>
    </li>
  );
}
