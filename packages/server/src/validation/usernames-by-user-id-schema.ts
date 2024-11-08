import { z } from "zod";

export const usernamesByUserIdsSchema = z.record(z.string());
