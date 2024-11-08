import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import PageSelector from "./page-selector";
import {
  CustomErrorDetails,
  SanitizedRaceGameAggregatedRecord,
  SanitizedRacePartyAggregatedRecord,
} from "@speed-dungeon/common";
import Divider from "@/app/components/atoms/Divider";

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

  const data =
    responseTracker?.ok && (responseTracker?.data as SanitizedRaceGameAggregatedRecord[]);

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
      <ul>
        {data &&
          data.map((item) => (
            <GameRecordCard key={item.game_id} username={username} gameRecord={item} />
          ))}
      </ul>
      {data && data.length === 0 && (
        <div>No games to show. Participate in raked race games to accumulate a game history.</div>
      )}

      <div className="mt-4">{data && data.length ? <PageSelector username={username} /> : ""}</div>
    </div>
  );
}

function GameRecordCard({
  gameRecord,
  username,
}: {
  username: string;
  gameRecord: SanitizedRaceGameAggregatedRecord;
}) {
  const wasVictory = (() => {
    for (const party of Object.values(gameRecord.parties)) {
      for (const character of Object.values(party.characters)) {
        if (character.usernameOfControllingUser === username) {
          if (party.is_winner) return true;
          else return false;
        }
      }
    }
  })();

  return (
    <li className="max-w-full border border-slate-400 p-2 mb-2 last:mb-0">
      <div className="w-full flex justify-between">
        <h5 className="text-lg">{gameRecord.game_name}</h5>
        <p>
          {gameRecord.time_of_completion
            ? new Date(gameRecord.time_of_completion).toLocaleString()
            : "In progress..."}
        </p>
      </div>
      <div>{wasVictory ? "Victory" : !gameRecord.time_of_completion ? "Pending" : "Wipe"}</div>
      <div className="w-full pr-2 pl-2">
        <Divider />
      </div>
      <h4 className="text-lg">Adventuring Parties</h4>
      <ul className="max-w-72">
        {Object.entries(gameRecord.parties).map(([name, party]) => (
          <PartyRecordCard key={party.party_id} partyName={name} party={party} />
        ))}
      </ul>
    </li>
  );
}

function PartyRecordCard({
  party,
  partyName,
}: {
  partyName: string;
  party: SanitizedRacePartyAggregatedRecord;
}) {
  return (
    <li className="mb-1">
      <div className="flex justify-between">
        <h5>{partyName}</h5>
        <div>
          {party.is_winner && "Winners"}
          {!party.is_winner &&
            (party.duration_to_wipe ? "Wiped" : party.duration_to_escape ? "Escaped" : "Wandering")}
        </div>
      </div>
    </li>
  );
}
