"use client";
import React from "react";
import { ParsedLadderQuery } from "../board-page/ParsedLadderQuery";
import { cumulativeClearTimesQuerySchema } from "../query-schemas";
import { CumulativeClearTimesBoard } from "./CumulativeClearTimesBoard";

export default function CumulativeClearTimesPage() {
  return (
    <ParsedLadderQuery schema={cumulativeClearTimesQuerySchema}>
      {(query) => <CumulativeClearTimesBoard query={query} />}
    </ParsedLadderQuery>
  );
}
