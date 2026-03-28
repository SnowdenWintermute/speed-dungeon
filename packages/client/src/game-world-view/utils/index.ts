import {
  AbstractMesh,
  AssetContainer,
  Color4,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { invariant } from "@speed-dungeon/common";

export function setTransformNodePositionAndRotationToZero(transformNode: TransformNode) {
  setTransformNodeRotationToZero(transformNode);
  transformNode.setPositionWithLocalVector(Vector3.Zero());
}

export function setTransformNodeRotationToZero(transformNode: TransformNode) {
  transformNode.rotationQuaternion = null;
  transformNode.rotation = Vector3.Zero();
}

export function getTransformNodeByName(container: AssetContainer, name: string) {
  for (const transformNode of container.transformNodes) {
    if (transformNode.name === name) return transformNode;
  }
  return undefined;
}

export function requireTransformNodeByName(container: AssetContainer, name: string) {
  const option = getTransformNodeByName(container, name);
  invariant(option !== undefined, "expected transformNode missing");
  return option;
}

export function getChildMeshByName(mesh: Mesh | AbstractMesh, name: string) {
  for (const node of mesh.getDescendants(false)) {
    if (node.name === name) return node;
  }
  return undefined;
}

export function getChildrenByName(rootNode: Node) {
  const childrenByName: Record<string, Node> = {};
  for (const node of rootNode.getDescendants(false)) {
    childrenByName[node.name] = node;
  }
  return childrenByName;
}

export function paintCubesOnNodeTree(
  rootNode: Node,
  cubeSize: number,
  color: Color4,
  scene: Scene
) {
  const result: Mesh[] = [];
  for (const node of rootNode.getDescendants(false)) {
    result.push(paintCubeOnNode(node, cubeSize, color, scene));
  }
  return result;
}

export function paintCubeOnNode(node: Node, cubeSize: number, color: Color4, scene: Scene) {
  const cube = MeshBuilder.CreateBox(
    `node-cube-${node.name}`,
    {
      height: cubeSize,
      width: cubeSize,
      depth: cubeSize,
      faceColors: new Array(6).fill(color),
    },
    scene
  );

  const billboard = createBillboard(node.name, scene);
  billboard.setParent(cube);
  billboard.setPositionWithLocalVector(new Vector3(0, 0, 0.1));

  cube.setParent(node);
  cube.setPositionWithLocalVector(new Vector3(0.0, 0.0, 0.0));
  return cube;
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
  invariant(scene.activeCamera !== null, "no camera in scene");
  const viewport = scene.activeCamera.viewport;

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

export function createBillboard(text: string, scene: Scene) {
  const dynamicTexture = new DynamicTexture(
    "dynamic texture",
    { width: 512, height: 256 },
    scene,
    false
  );
  dynamicTexture.hasAlpha = true;
  dynamicTexture.drawText(text, null, 140, "bold 10px Arial", "white", "transparent", true);

  // Apply it to a plane mesh
  const plane = MeshBuilder.CreatePlane("textPlane", { size: 1 }, scene);
  const material = new StandardMaterial("textMaterial", scene);
  material.diffuseTexture = dynamicTexture;
  material.backFaceCulling = false; // So text is visible from behind
  plane.material = material;

  // Set billboard mode
  plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
  return plane;
}
