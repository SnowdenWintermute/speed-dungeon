"use client";
import React from "react";
import { ParsedLadderQuery } from "../board-page/ParsedLadderQuery";
import { experiencePointsLadderQuerySchema } from "../query-schemas";
import { ExperiencePointsBoard } from "./ExperiencePointsBoard";

export default function ExperiencePointsLadderPage() {
  return (
    <ParsedLadderQuery schema={experiencePointsLadderQuerySchema}>
      {(query) => <ExperiencePointsBoard query={query} />}
    </ParsedLadderQuery>
  );
}
