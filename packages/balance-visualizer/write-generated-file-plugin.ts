import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { WRITE_GENERATED_EVASION_ROUTE } from "./src/analysis/monster-attributes/generated-evasion-route";

const PACKAGE_ROOT = fileURLToPath(new URL(".", import.meta.url));
/** Fixed here rather than taken from the request. The browser sends contents and nothing else, so
 * there is no path for a page to point this at a file it should not be able to overwrite. */
const GENERATED_EVASION_PATH = path.join(PACKAGE_ROOT, "src/dummies/monster-evasion.generated.ts");

function readBody(request: { on: (event: string, listener: (chunk?: Buffer) => void) => void }) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunk !== undefined && chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", () => reject(new Error("could not read the request body")));
  });
}

/** Lets the app write the evasion table it just derived, so a measurement seen in the browser can be
 * frozen without re-running the same walk from the terminal. Dev only — there is no server in a
 * build, and freezing a table is a thing done while tuning. */
export function writeGeneratedFilePlugin(): Plugin {
  return {
    name: "speed-dungeon-write-generated-file",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(WRITE_GENERATED_EVASION_ROUTE, (request, response, next) => {
        if (request.method !== "POST") {
          next();
          return;
        }

        readBody(request).then(
          (contents) => {
            fs.writeFileSync(GENERATED_EVASION_PATH, contents);
            response.statusCode = 200;
            response.end(GENERATED_EVASION_PATH);
          },
          (error: Error) => {
            response.statusCode = 500;
            response.end(error.message);
          }
        );
      });
    },
  };
}
