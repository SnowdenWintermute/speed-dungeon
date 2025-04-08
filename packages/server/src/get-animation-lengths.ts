import { NodeIO } from "@gltf-transform/core";
import {
  CombatantSpecies,
  DEBUG_ANIMATION_SPEED_MULTIPLIER,
  SKELETON_FILE_PATHS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export async function getAnimationLengths(filePath: string) {
  const io = new NodeIO();
  const document = await io.read(filePath);

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

      maxTime *= DEBUG_ANIMATION_SPEED_MULTIPLIER;

      toReturn[anim.getName()] = maxTime; // Duration in seconds
    });
  return toReturn;
}

export async function collectAnimationLengths() {
  const assetsFolderPath = "./assets/";
  const toReturn: Record<CombatantSpecies, Record<string, number>> = {
    [CombatantSpecies.Humanoid]: {},
    [CombatantSpecies.Dragon]: {},
    [CombatantSpecies.Skeleton]: {},
    [CombatantSpecies.Velociraptor]: {},
    [CombatantSpecies.Elemental]: {},
    [CombatantSpecies.Golem]: {},
  };

  for (const [species, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
    const animationLengths = await getAnimationLengths(assetsFolderPath + skeletonPath);
    toReturn[species] = animationLengths;
  }

  return toReturn;
}
