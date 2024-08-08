import {
  AbstractMesh,
  Color4,
  ISceneLoaderAsyncResult,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  Vector3,
} from "babylonjs";

export function getTransformNodeByName(sceneResult: ISceneLoaderAsyncResult, name: string) {
  for (const transformNode of sceneResult.transformNodes) {
    if (transformNode.name === name) return transformNode;
  }
  return undefined;
}

export function getRootBone(mesh: Mesh | AbstractMesh) {
  for (const node of mesh.getDescendants(false)) {
    if (node.name === "Root") return node;
  }
  return undefined;
}

export function disposeAsyncLoadedScene(sceneResult: ISceneLoaderAsyncResult | null) {
  if (sceneResult === null) return;
  while (sceneResult.meshes.length) sceneResult.meshes.pop()!.dispose();
  while (sceneResult.skeletons.length) sceneResult.skeletons.pop()!.dispose();
  while (sceneResult.transformNodes.length) sceneResult.transformNodes.pop()!.dispose();
  while (sceneResult.lights.length) sceneResult.lights.pop()!.dispose();
  while (sceneResult.geometries.length) sceneResult.geometries.pop()!.dispose();
  while (sceneResult.spriteManagers.length) sceneResult.spriteManagers.pop()!.dispose();
  while (sceneResult.animationGroups.length) sceneResult.animationGroups.pop()!.dispose();
  while (sceneResult.particleSystems.length) sceneResult.particleSystems.pop()!.dispose();
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

    boneMarkerCube.setParent(node);
    boneMarkerCube.setPositionWithLocalVector(new Vector3(0.0, 0.0, 0.0));
  }
}
