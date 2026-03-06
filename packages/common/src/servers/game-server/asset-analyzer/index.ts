import { Milliseconds } from "../../../aliases.js";
import { SKELETON_FILE_PATHS } from "../../../assets/skeleton-file-paths.js";
import { CombatantSpecies } from "../../../combatants/combatant-species.js";
import { BoundingBoxSizesBySpecies } from "../../../types.js";
import { invariant, iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { AssetId, AssetService } from "../../services/assets/index.js";
import { WebIO } from "@gltf-transform/core";

export type SpeciesAnimationLengths = Record<CombatantSpecies, Record<string, Milliseconds>>;

export class AssetAnalyzer {
  private _animationLengths: SpeciesAnimationLengths = {
    [CombatantSpecies.Humanoid]: {},
    [CombatantSpecies.Canine]: {},
    [CombatantSpecies.Ray]: {},
    [CombatantSpecies.Net]: {},
    [CombatantSpecies.Spider]: {},
  };

  private _boundingBoxes: BoundingBoxSizesBySpecies = {};

  constructor(private assetService: AssetService) {}

  async collectAnimationLengths() {
    console.log("collecting animation lengths");
    for (const [species, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
      const animationLengths = await this.getAnimationLengths(skeletonPath as AssetId);
      this._animationLengths[species] = animationLengths;
    }
  }

  get animationLengths() {
    return this._animationLengths;
  }

  private async getAnimationLengths(assetId: AssetId) {
    try {
      const asset = await this.assetService.getAsset(assetId);
      const bytes = new Uint8Array(asset);
      const io = new WebIO();
      const document = await io.readBinary(bytes);
      const toReturn: Record<string, number> = {};
      document
        .getRoot()
        .listAnimations()
        .forEach((anim) => {
          const samplers = anim.listSamplers();
          let maxTime = 0;

          for (const sampler of samplers) {
            const input = sampler.getInput(); // Input is the list of keyframe times
            if (!input) return;
            const times = input.getArray(); // Get the actual keyframe time values
            if (!times) return;
            if (times.length > 0) {
              const time = times[times.length - 1];
              if (time === undefined) return;
              maxTime = Math.max(maxTime, time); // Last keyframe is the duration
            }
          }

          toReturn[anim.getName()] = Math.floor(maxTime * 1000); // convert from seconds to milliseconds and truncate
        });
      return toReturn;
    } catch (error) {
      console.error("couldn't read asset for getting animationLengths", assetId, error);
      return {};
    }
  }

  async collectBoundingBoxSizes() {
    for (const [species, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
      const boundingBoxDimensions = await this.computeBoundingBoxFromGLB(skeletonPath as AssetId);
      this._boundingBoxes[species] = boundingBoxDimensions;
    }
  }

  get boundingBoxes() {
    return this._boundingBoxes;
  }

  // using the skeleton right now, but could use meshes later
  private async computeBoundingBoxFromGLB(assetId: AssetId) {
    try {
      const asset = await this.assetService.getAsset(assetId);
      const bytes = new Uint8Array(asset);
      const io = new WebIO();
      const doc = await io.readBinary(bytes);
      const root = doc.getRoot();

      const globalMin: [number, number, number] = [Infinity, Infinity, Infinity];
      const globalMax: [number, number, number] = [-Infinity, -Infinity, -Infinity];

      const skins = root.listSkins();
      const skeleton = skins[0];
      invariant(skeleton !== undefined, "expected a skeleton");

      for (const bone of skeleton.listJoints()) {
        const m = bone.getWorldMatrix();
        invariant(m !== undefined, "expected bone world matrix");
        const x = m[12];
        const y = m[13];
        const z = m[14];

        if (x < globalMin[0]) globalMin[0] = x;
        if (y < globalMin[1]) globalMin[1] = y;
        if (z < globalMin[2]) globalMin[2] = z;

        if (x > globalMax[0]) globalMax[0] = x;
        if (y > globalMax[1]) globalMax[1] = y;
        if (z > globalMax[2]) globalMax[2] = z;
      }

      const dx = globalMax[0] - globalMin[0];
      const dy = globalMax[1] - globalMin[1];
      const dz = globalMax[2] - globalMin[2];

      const diagonal = Math.sqrt(dx * dx + dy * dy + dz * dz);

      return { min: globalMin, max: globalMax, volume: diagonal };
    } catch (error) {
      console.info("couldn't compute bounding box size for", assetId, error);
    }
  }
}
