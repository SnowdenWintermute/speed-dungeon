import React from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="h-screen w-screen pt-10 flex flex-col items-center">
      <h1 className="mb-4">{message}...</h1>
      <div className="h-10 w-10">
        <LoadingSpinner />
      </div>
    </main>
  );
}
