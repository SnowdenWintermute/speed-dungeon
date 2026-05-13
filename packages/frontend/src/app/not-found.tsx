"use client";
import React from "react";
import { useRouter } from "next/navigation";
import ButtonBasic from "./components/atoms/ButtonBasic";

export default function page() {
  const router = useRouter();
  return (
    <main className="flex flex-col justify-center items-center h-full">
      <h1 className="text-3xl mb-10">404 - page not found</h1>
      <h3 className="text-xl mb-6">You've wandered alone into an empty room of the dungeon...</h3>
      <ButtonBasic
        onClick={() => {
          router.push("/");
        }}
      >
        RETURN TO YOUR PARTY
      </ButtonBasic>
    </main>
  );
}
