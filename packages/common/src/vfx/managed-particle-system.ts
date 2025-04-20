import { GPUParticleSystem, Mesh, ParticleSystem } from "@babylonjs/core";

export class ManagedParticleSystem {
  softCleanupTimeout: null | NodeJS.Timeout = null;
  constructor(
    public particleSystem: GPUParticleSystem | ParticleSystem,
    public mesh: Mesh
  ) {}

  softCleanup() {
    const { particleSystem } = this;
    particleSystem.stop();
    particleSystem.emitRate = 0;

    const remainingParticles = particleSystem.getActiveCount();

    this.softCleanupTimeout = setTimeout(() => {
      this.cleanup();
    }, particleSystem.maxLifeTime * 1000);
    // if (remainingParticles > 0) {
    //   this.softCleanupLoopTimeout = setTimeout(() => {
    //     this.softCleanup();
    //   }, 100);
    //   return;
    // }
  }

  cleanup() {
    this.particleSystem.stop();
    this.mesh.dispose();
    this.particleSystem.dispose();
  }
}
