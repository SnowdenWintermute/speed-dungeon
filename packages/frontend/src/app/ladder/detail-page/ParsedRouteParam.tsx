"use client";
import React, { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ZodType, ZodTypeDef } from "zod";

// the path-segment counterpart of ParsedLadderQuery: a record page is only rendered once the id in
// its url is one, so nothing below it holds a maybe-id.
// no memo, unlike the query version — what comes out is a string, which the fetching hook compares
// by value rather than by identity
export function ParsedRouteParam<TParam>({
  name,
  schema,
  children,
}: {
  name: string;
  schema: ZodType<TParam, ZodTypeDef, unknown>;
  children: (param: TParam) => ReactNode;
}) {
  const params = useParams();
  const parseResult = schema.safeParse(params[name]);

  if (!parseResult.success) {
    return <p className="text-red-400">{`invalid url: ${parseResult.error.message}`}</p>;
  }

  return <>{children(parseResult.data)}</>;
}
