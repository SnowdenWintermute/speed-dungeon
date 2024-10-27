import { z } from "zod";

export const userIdsByUsernameSchema = z.record(z.number());
