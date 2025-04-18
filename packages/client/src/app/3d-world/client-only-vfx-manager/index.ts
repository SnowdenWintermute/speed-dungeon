import { ClientOnlyVfx, ClientOnlyVfxNames } from "@speed-dungeon/common";

export class ClientOnlyVfxManager {
  clientOnlyVfx: Partial<Record<ClientOnlyVfxNames, ClientOnlyVfx>> = {};
  constructor() {}
}
