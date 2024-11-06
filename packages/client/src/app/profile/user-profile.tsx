import React from "react";

export default async function UserProfile({
  username,
  pageNumber,
}: {
  username: string;
  pageNumber: number;
}) {
  // const wait = await new Promise((resolve, reject) => {
  //   setTimeout(() => resolve(true), 2000);
  // });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/game-records/${username}/${pageNumber}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { "content-type": "application/json" },
    }
  );

  const data = await response.json();

  return <div>{JSON.stringify(data, null, 2)}</div>;
}
