import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { READ_SAVED_RUN_ROUTE, WRITE_GENERATED_FILE_ROUTE } from "./src/generated-file-route";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** the paths the route will write, so a request carries contents and a key rather than a path */
const WRITABLE_PATHS = ["packages/common/src/monsters/monster-evasion.generated.ts"];

/**
 * Saved runs and per-study requirement modules are named after studies, which is app-side data this
 * plugin has no way to import. So these two are allowed by shape rather than listed, and the checks
 * in isWritable are what keep that from meaning "anywhere".
 */
const SAVED_RUN_DIRECTORY = "packages/balance-tools/saved-runs";
const REQUIREMENTS_DIRECTORY = "packages/common/src/items/item-creation/equipment-templates";
const REQUIREMENTS_PREFIX = "requirements-from-";

/** a study slug plus .json, which is the only shape either saved-run route accepts */
const SAVED_RUN_FILE_NAME = /^[a-z0-9-]+\.json$/;

/**
 * Only the modules the *browser* writes. A sync-written one — game data, attribute tables, the
 * requirement targets — should still reload the page, or the app goes on running against a workbook
 * you have already changed. The app loads the compiled copy, so this has to catch the .js and .d.ts
 * beside every src module.
 */
function isBrowserWrittenModule(file: string) {
  const name = path.basename(file);
  return (
    name.startsWith(REQUIREMENTS_PREFIX) ||
    WRITABLE_PATHS.some((writable) => name.startsWith(path.basename(writable, ".ts")))
  );
}

function isWritable(generatedPath: string) {
  if (generatedPath.includes("..")) {
    return false;
  }
  if (WRITABLE_PATHS.includes(generatedPath)) {
    return true;
  }

  const directory = path.dirname(generatedPath);
  const name = path.basename(generatedPath);

  if (directory === SAVED_RUN_DIRECTORY) {
    return SAVED_RUN_FILE_NAME.test(name);
  }
  return (
    directory === REQUIREMENTS_DIRECTORY &&
    name.startsWith(REQUIREMENTS_PREFIX) &&
    name.endsWith(".generated.ts")
  );
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
 * Lets a study in the browser write its generated module to disk, and read back the run it last
 * saved. `apply: "serve"` keeps both out of builds and out of `vite preview`.
 */
export function writeGeneratedFilePlugin(): Plugin {
  return {
    name: "write-generated-file",
    apply: "serve",
    // common is a workspace symlink, so its dist sits outside node_modules and vite watches it. the
    // write lands there a beat later as a recompile, and a plain const module cannot hot-accept, so
    // the page would full-reload and throw away the run set that produced the file. saved runs are
    // the same hazard, and server.watch.ignored in vite.config.ts keeps the watcher off those
    hotUpdate({ file }) {
      if (isBrowserWrittenModule(file)) {
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use(READ_SAVED_RUN_ROUTE, (request, response, next) => {
        if (request.method !== "GET") {
          return next();
        }

        // middlewares.use strips the mount path, leaving a leading slash and any query string
        const name = (request.url ?? "").split("?")[0]?.replace(/^\//, "") ?? "";
        if (!SAVED_RUN_FILE_NAME.test(name)) {
          response.statusCode = 400;
          return response.end(`${name} is not a saved run file name`);
        }

        const source = path.join(REPO_ROOT, SAVED_RUN_DIRECTORY, name);
        if (!fs.existsSync(source)) {
          // the ordinary case before a study has ever been saved, so it must be a real 404
          response.statusCode = 404;
          return response.end(`no saved run at ${name}`);
        }

        response.statusCode = 200;
        response.setHeader("content-type", "application/json");
        fs.createReadStream(source).pipe(response);
      });

      server.middlewares.use(WRITE_GENERATED_FILE_ROUTE, (request, response, next) => {
        if (request.method !== "POST") {
          return next();
        }

        readBody(request)
          .then((body) => {
            const { generatedPath, contents } = JSON.parse(body);

            if (!isWritable(generatedPath)) {
              response.statusCode = 403;
              return response.end(`${generatedPath} is not a writable generated file`);
            }

            const destination = path.join(REPO_ROOT, generatedPath);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
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
