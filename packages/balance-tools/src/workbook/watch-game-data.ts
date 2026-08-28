import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PACKAGE_ROOT, WORKBOOK_PATH } from "./game-data-paths.ts";

const DEBOUNCE_MS = 300;
const SYNC_ENTRY = path.join(PACKAGE_ROOT, "src", "workbook", "sync-game-data.ts");

class WorkbookWatcher {
  private debounceTimer: null | ReturnType<typeof setTimeout> = null;
  private syncing = false;
  private syncQueued = false;

  start() {
    // the directory rather than the file: saving replaces the workbook rather than writing through
    // it, so a watch on the file itself goes quiet once the original is gone
    fs.watch(path.dirname(WORKBOOK_PATH), (_event, filename) => {
      if (filename === path.basename(WORKBOOK_PATH)) {
        this.scheduleSync();
      }
    });

    console.log(`watching ${WORKBOOK_PATH}`);
    this.sync();
  }

  /** a save arrives as a burst of events, and the workbook is only whole once they stop */
  private scheduleSync() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.sync();
    }, DEBOUNCE_MS);
  }

  // a child process rather than an imported function: sync throws on anything the sheets get wrong,
  // and the watcher has to outlive that and pick up the fix
  private sync() {
    if (this.syncing) {
      this.syncQueued = true;
      return;
    }
    this.syncing = true;

    const child = spawn(process.execPath, ["--experimental-transform-types", SYNC_ENTRY], {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`sync failed — fix the workbook and save again`);
      }
      this.onSyncSettled();
    });
    child.on("error", (error) => {
      console.error("could not start sync", error);
      this.onSyncSettled();
    });
  }

  private onSyncSettled() {
    this.syncing = false;
    if (this.syncQueued) {
      this.syncQueued = false;
      this.sync();
    }
  }
}

new WorkbookWatcher().start();
