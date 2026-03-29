import React from "react";

export default async function WinLossRecord({ username }: { username: string }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game-records/win-loss-records/${username}`,
    {
      method: "GET",
      headers: { "content-type": "application/json" },
      cache: "no-cache",
    }
  );

  if (!res.ok) return <div>Connection to game server failed</div>;

  const data: { wins: string; losses: string } = await res.json();
  if (typeof data.wins !== "string") return <div>No record found</div>;
  const wins = parseInt(data.wins);
  const losses = parseInt(data.losses);

  const winPercentage =
    wins === 0 && losses === 0
      ? "not enough data"
      : losses === 0
        ? "100%"
        : ((wins / (wins + losses)) * 100).toFixed(2) + "%";

  return (
    <div className="">
      <div>
        <span className="mr-2">
          Win/Loss {wins}/{losses}
        </span>
      </div>
      <div>Win Percentage {winPercentage}</div>
    </div>
  );
}
