import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import PageSelector from "./page-selector";

export default function GameHistory() {
  const searchParams = useSearchParams();
  const params = useParams();
  const { username } = params;
  const pageParam = searchParams.get("page") || "0";
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
        credentials: "include",
      }
    );
  }, [page]);

  return (
    <div>
      <PageSelector />
      {[username, page]}
      {responseTracker?.loading && (
        <div className="h-10 w-10">
          <LoadingSpinner />
        </div>
      )}
      {responseTracker?.data && JSON.stringify(responseTracker.data)}
    </div>
  );
}
