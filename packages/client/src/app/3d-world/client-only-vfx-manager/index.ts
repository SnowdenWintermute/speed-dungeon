import { ClientOnlyVfx, ClientOnlyVfxNames } from "@speed-dungeon/common";

export class ClientOnlyVfxManager {
  clientOnlyVfx: Partial<Record<ClientOnlyVfxNames, ClientOnlyVfx>> = {};
  constructor() {}

  softCleanup() {
    for (const vfx of Object.values(this.clientOnlyVfx)) vfx.softCleanup();
  }
  cleanup() {
    for (const vfx of Object.values(this.clientOnlyVfx)) vfx.cleanup();
  }
}
