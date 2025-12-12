import { NodeIO } from "@gltf-transform/core";
import {
  CombatantSpecies,
  SKELETON_FILE_PATHS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export async function collectBoundingBoxSizes() {
  const assetsFolderPath = "./assets/";
  const toReturn: Partial<
    Record<CombatantSpecies, { min: [number, number, number]; max: [number, number, number] }>
  > = {};

  for (const [species, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
    const boundingBoxDimensions = await computeBoundingBoxFromGLB(assetsFolderPath + skeletonPath);
    toReturn[species] = boundingBoxDimensions;
  }

  return toReturn;
}

async function computeBoundingBoxFromGLB(pathToFile: string) {
  const io = new NodeIO();
  try {
    const doc = await io.read(pathToFile);
    const root = doc.getRoot();

    const globalMin: [number, number, number] = [Infinity, Infinity, Infinity];
    const globalMax: [number, number, number] = [-Infinity, -Infinity, -Infinity];

    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const positionAccessor = prim.getAttribute("POSITION");
        if (!positionAccessor) continue;

        // Read raw positions
        const array = positionAccessor.getArray(); // Float32Array

        if (!array) continue; // skip empty accessors

        for (let i = 0; i < array.length; i += 3) {
          // Non-null assertion
          const x = array[i]!;
          const y = array[i + 1]!;
          const z = array[i + 2]!;

          // const x = array[i];
          // const y = array[i + 1];
          // const z = array[i + 2];

          if (x < globalMin[0]) globalMin[0] = x;
          if (y < globalMin[1]) globalMin[1] = y;
          if (z < globalMin[2]) globalMin[2] = z;

          if (x > globalMax[0]) globalMax[0] = x;
          if (y > globalMax[1]) globalMax[1] = y;
          if (z > globalMax[2]) globalMax[2] = z;
        }
      }
    }

    // console.log("computed boundingBoxDimensions for", pathToFile, globalMin, globalMax);

    return { min: globalMin, max: globalMax };
  } catch (error) {
    // console.log("couldnt't comput bounding box size for", pathToFile);
  }
}
