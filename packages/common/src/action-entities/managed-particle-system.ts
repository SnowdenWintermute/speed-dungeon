import { GPUParticleSystem, Mesh, ParticleSystem, Scene } from "@babylonjs/core";

export class ManagedParticleSystem {
  softCleanupTimeout: null | NodeJS.Timeout = null;
  constructor(
    public particleSystem: GPUParticleSystem | ParticleSystem,
    public mesh: Mesh,
    public scene: Scene
  ) {}

  softCleanup() {
    const { particleSystem } = this;
    particleSystem.stop();

    if (particleSystem instanceof GPUParticleSystem) {
      // FOR GPU PARTICLE SYSTEMS
      const obs = this.scene.onBeforeRenderObservable.add(() => {
        if (particleSystem.isStopped()) {
          this.softCleanupTimeout = setTimeout(
            () => {
              this.cleanup();
              this.scene.onBeforeRenderObservable.remove(obs);
            },
            particleSystem.maxLifeTime * 1000 + 1000
          );
        }
      });
    } else {
      // FOR CPU PARTICLE SYSTEMS
      const remainingParticles = particleSystem.getActiveCount();
      if (remainingParticles > 0) {
        this.softCleanupTimeout = setTimeout(() => {
          this.softCleanup();
        }, 100);
      } else {
        this.cleanup();
      }
    }
  }

  cleanup() {
    if (this.softCleanupTimeout !== null) clearTimeout(this.softCleanupTimeout);
    this.particleSystem.stop();
    this.mesh.dispose();
    this.particleSystem.dispose();
  }
}
