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

  return (
    <div className="">
      <div>
        <span className="mr-2">
          Win/Loss {wins}/{losses}
        </span>
      </div>
      <div>Win Percentage {((wins / losses) * 100).toFixed(2)}%</div>
    </div>
  );
}
