import { cleanEnv, str, url } from "envalid";

console.log(process.env.NODE_ENV);
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  FRONT_END_URL: url(),
});
