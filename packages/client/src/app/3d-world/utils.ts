import {
  AbstractMesh,
  AssetContainer,
  Color4,
  LoadAssetContainerAsync,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { createBillboard } from "@/utils";
import { BASE_FILE_PATH } from "./scene-entities/character-models/modular-character-parts-model-manager/modular-character-parts";

export async function importMesh(path: string, scene: Scene) {
  if (path === "") throw new Error("Empty file path");

  const assetContainer = await LoadAssetContainerAsync((BASE_FILE_PATH || "") + path, scene);
  assetContainer.addToScene();

  return assetContainer;
}

export function getTransformNodeByName(sceneResult: AssetContainer, name: string) {
  for (const transformNode of sceneResult.transformNodes) {
    if (transformNode.name === name) return transformNode;
  }
  return undefined;
}

export function getChildMeshByName(mesh: Mesh | AbstractMesh, name: string) {
  for (const node of mesh.getDescendants(false)) {
    if (node.name === name) return node;
  }
  return undefined;
}

export function disposeAsyncLoadedScene(sceneResult: AssetContainer | null) {
  if (sceneResult?.dispose) sceneResult.dispose();
}

export function getChildrenByName(rootNode: Node) {
  const childrenByName: { [name: string]: Node } = {};
  for (const node of rootNode.getDescendants(false)) {
    childrenByName[node.name] = node;
  }
  return childrenByName;
}

export function paintCubesOnNodes(rootNode: Node, cubeSize: number, color: Color4, scene: Scene) {
  for (const node of rootNode.getDescendants(false)) {
    const boneMarkerCube = MeshBuilder.CreateBox(
      `node-cube-${node.name}`,
      {
        height: cubeSize,
        width: cubeSize,
        depth: cubeSize,
        faceColors: new Array(6).fill(color),
      },
      // @ts-ignore
      scene
    );

    const billboard = createBillboard(node.name, scene);
    billboard.setParent(boneMarkerCube);
    billboard.setPositionWithLocalVector(new Vector3(0, 0, 0.1));

    boneMarkerCube.setParent(node);
    boneMarkerCube.setPositionWithLocalVector(new Vector3(0.0, 0.0, 0.0));
  }
}

// adapted from https://forum.babylonjs.com/t/get-mesh-bounding-box-position-and-size-in-2d-screen-coordinates/1058/3
export function getClientRectFromMesh(
  scene: Scene,
  canvas: HTMLCanvasElement,
  mesh: Mesh | AbstractMesh
): DOMRect {
  // get bounding box of the mesh
  const meshVectors = mesh.getBoundingInfo().boundingBox.vectors;

  // get the matrix and viewport needed to project the vectors onto the screen
  const worldMatrix = mesh.getWorldMatrix();
  const transformMatrix = scene.getTransformMatrix();
  const viewport = scene.activeCamera!.viewport;

  // loop though all the vectors and project them against the current camera viewport to get a set of coordinates
  const coordinates = meshVectors.map((v) => {
    const proj = Vector3.Project(v, worldMatrix, transformMatrix, viewport);
    proj.x = proj.x * canvas.clientWidth;
    proj.y = proj.y * canvas.clientHeight;
    return proj;
  });

  if (!coordinates[0]) throw new Error("no coordinates on that mesh");
  const extent = {
    minX: coordinates[0].x,
    maxX: coordinates[0].x,
    minY: coordinates[0].y,
    maxY: coordinates[0].y,
  };

  coordinates.forEach((current, i) => {
    if (i === 0) return;
    if (current.x < extent.minX) extent.minX = current.x;
    if (current.x > extent.maxX) extent.maxX = current.x;
    if (current.y < extent.minY) extent.minY = current.y;
    if (current.y > extent.maxY) extent.maxY = current.y;
  });
  const { minX, maxX, minY, maxY } = extent;

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

export function calculateCompositeBoundingBox(meshes: AbstractMesh[]): {
  min: Vector3;
  max: Vector3;
} {
  const parentMesh = meshes[0];
  if (!parentMesh) {
    throw new Error("No meshes provided to calculate bounding box.");
  }

  let compositeMin = parentMesh.getBoundingInfo().boundingBox.minimumWorld.clone();
  let compositeMax = parentMesh.getBoundingInfo().boundingBox.maximumWorld.clone();

  for (const mesh of meshes) {
    const boundingInfo = mesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    compositeMin = Vector3.Minimize(compositeMin, min);
    compositeMax = Vector3.Maximize(compositeMax, max);
  }

  return { min: compositeMin, max: compositeMax };
}
