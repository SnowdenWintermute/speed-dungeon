"use client";
import React from "react";
import { ParsedLadderQuery } from "../board-page/ParsedLadderQuery";
import { floorClearTimesQuerySchema } from "../query-schemas";
import { FloorClearTimesBoard } from "./FloorClearTimesBoard";

export default function FloorClearTimesPage() {
  return (
    <ParsedLadderQuery schema={floorClearTimesQuerySchema}>
      {(query) => <FloorClearTimesBoard query={query} />}
    </ParsedLadderQuery>
  );
}
