import { FrostParticleStream } from "./frost-particle-stream.js";
import { FrostParticleAccumulation } from "./frost-particle-accumulation.js";
import { Scene } from "@babylonjs/core";
import { ClientOnlyVfx, ClientOnlyVfxNames } from "./client-only-vfx.js";
import { FrostParticleBurst } from "./frost-particle-burst.js";

type ClientOnlyVfxConstructor = new (scene: Scene) => ClientOnlyVfx;

export const CLIENT_ONLY_VFX_CONSTRUCTORS: Record<ClientOnlyVfxNames, ClientOnlyVfxConstructor> = {
  [ClientOnlyVfxNames.FrostParticleAccumulation]: FrostParticleAccumulation,
  [ClientOnlyVfxNames.FrostParticleStream]: FrostParticleStream,
  [ClientOnlyVfxNames.FrostParticleBurst]: FrostParticleBurst,
};
