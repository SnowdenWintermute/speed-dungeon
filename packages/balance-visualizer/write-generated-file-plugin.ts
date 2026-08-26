import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { WRITE_GENERATED_FILE_ROUTE } from "./src/generated-file-route";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** the paths the route will write, so a request carries contents and a key rather than a path */
const WRITABLE_PATHS = ["packages/common/src/monsters/monster-evasion.generated.ts"];

// the app loads the compiled copy, so match on the module name and catch both src and dist
const GENERATED_MODULE_NAMES = WRITABLE_PATHS.map((generatedPath) =>
  path.basename(generatedPath, ".ts")
);

function isGeneratedModule(file: string) {
  return GENERATED_MODULE_NAMES.some((name) => path.basename(file).startsWith(name));
}

async function readBody(request: { on: NodeJS.ReadableStream["on"] }) {
  const chunks: Buffer[] = [];
  return new Promise<string>((resolve, reject) => {
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

/**
 * Lets a study in the browser write its generated module to disk. `apply: "serve"` keeps it out of
 * builds and out of `vite preview`.
 */
export function writeGeneratedFilePlugin(): Plugin {
  return {
    name: "write-generated-file",
    apply: "serve",
    // common is a workspace symlink, so its dist sits outside node_modules and vite watches it. the
    // write lands there a beat later as a recompile, and a plain const module cannot hot-accept, so
    // the page would full-reload and throw away the run set that produced the file
    hotUpdate({ file }) {
      if (isGeneratedModule(file)) {
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use(WRITE_GENERATED_FILE_ROUTE, (request, response, next) => {
        if (request.method !== "POST") {
          return next();
        }

        readBody(request)
          .then((body) => {
            const { generatedPath, contents } = JSON.parse(body);

            if (!WRITABLE_PATHS.includes(generatedPath)) {
              response.statusCode = 403;
              return response.end(`${generatedPath} is not a writable generated file`);
            }

            const destination = path.join(REPO_ROOT, generatedPath);
            fs.writeFileSync(destination, contents);
            server.config.logger.info(`wrote ${generatedPath}`);
            response.statusCode = 200;
            response.end(destination);
          })
          .catch((error) => {
            response.statusCode = 500;
            response.end(error instanceof Error ? error.message : String(error));
          });
      });
    },
  };
}
