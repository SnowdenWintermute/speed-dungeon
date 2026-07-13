import {
  ActionManager,
  Color3,
  DynamicTexture,
  ExecuteCodeAction,
  Matrix,
  Mesh,
  MeshBuilder,
  Nullable,
  Observer,
  PointerEventTypes,
  PointerInfo,
  StandardMaterial,
  TransformNode,
  Vector2,
  Vector3,
} from "@babylonjs/core";
import { EntityId } from "@speed-dungeon/common";
import { GameWorldView } from "..";
import { GLOW_LAYER_NAME } from "../game-world-view-consts";

const RETICLE_SVG_URL = "/img/game-ui-icons/reticle-brackets.svg";
// world-space so the reticle scales with zoom/distance (a farther entity is a smaller,
// harder-to-click target) — a simplified stand-in for picking the mesh itself
const RETICLE_WORLD_SIZE = 0.6;
// its own rendering group (with a depth clear configured on the scene) so the reticle draws on
// top of the entity's mesh instead of clipping through it
export const SCENE_ENTITY_PICKER_DISC_RENDERING_GROUP_ID = 1;
// the pointer must come within this world radius of the center (projected to the screen) to
// fade the reticle in — a bit farther out than the reticle itself
const HOVER_THRESHOLD_WORLD_RADIUS = 0.7;
const HOVERED_SCALE = 1.2;
const ALPHA_LERP_PER_MS = 0.003;
const SCALE_LERP_PER_MS = 0.003;
// pulse between the two yellows of the focused-combatant turn indicator
const PULSE_FREQUENCY_HZ = 0.3;
const DARKER_YELLOW = new Color3(0.725, 0.576, 0.243);
const LIGHTER_YELLOW = new Color3(0.941, 0.788, 0.565);

/** Composed by a scene entity: a camera-facing reticle at the entity's center that pulses
 * between two yellows, fades in and scales up when the pointer comes near, and delegates to a
 * click callback when tapped. The entity's own meshes are non-pickable so a tap resolves here. */
export class SceneEntityPickerDisc {
  private readonly plane: Mesh;
  private readonly material: StandardMaterial;
  private readonly texture: DynamicTexture;
  private pointerObserver: Nullable<Observer<PointerInfo>>;
  private hovered = false;

  constructor(
    private gameWorldView: GameWorldView,
    entityId: EntityId,
    private getWorldPosition: () => Vector3,
    onClick: () => void,
    private shouldShow: () => boolean
  ) {
    const { scene } = gameWorldView;

    this.texture = new DynamicTexture(`${entityId}-reticle`, 256, scene, false);
    this.texture.hasAlpha = true;
    gameWorldView.textureManager.fillDynamicTextureWithSvg(RETICLE_SVG_URL, this.texture, {
      fillColor: "white",
      strokeColor: "white",
    });

    this.material = new StandardMaterial(`${entityId}-reticle`, scene);
    this.material.diffuseTexture = this.texture;
    // multiply the fade (material.alpha) by the texture's own alpha; without this, while fading
    // the material uses a uniform alpha for the whole quad and the transparent (black) regions
    // of the svg render as semi-transparent black instead of staying transparent
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.alpha = 0;

    this.plane = MeshBuilder.CreatePlane(
      `${entityId}-reticle`,
      { size: RETICLE_WORLD_SIZE },
      scene
    );
    this.plane.material = this.material;
    this.plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    this.plane.renderingGroupId = SCENE_ENTITY_PICKER_DISC_RENDERING_GROUP_ID;
    this.plane.isPickable = true;
    scene.getGlowLayerByName(GLOW_LAYER_NAME)?.addExcludedMesh(this.plane);

    // show the button/pointer cursor while hovering the reticle. babylon applies hoverCursor
    // when the pointer is over a mesh whose actionManager has pointer triggers, so register a
    // no-op over-action to enable it (the click itself is handled by POINTERTAP below)
    this.plane.actionManager = new ActionManager(scene);
    this.plane.actionManager.hoverCursor = "pointer";
    this.plane.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {})
    );

    this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      // POINTERTAP only fires on a press+release without a drag, so camera orbit/zoom never
      // count as a click; the pick resolves to this reticle since the character meshes aren't pickable
      if (
        pointerInfo.type === PointerEventTypes.POINTERTAP &&
        pointerInfo.pickInfo?.pickedMesh === this.plane
      ) {
        onClick();
        // if the click made this reticle non-pickable (e.g. focusing this character), babylon
        // only re-resolves the hover cursor on pointer move — clear the hovered mesh and reset
        // the canvas cursor now instead of waiting for a move. if it's still clickable (e.g. a
        // monster you can click again to execute the action), leave the pointer cursor as is.
        if (!this.shouldShow()) {
          scene.setPointerOverMesh(null);
          this.gameWorldView.canvas.style.cursor = scene.defaultCursor;
        }
      }
    });
  }

  update(deltaTime: number) {
    const worldCenter = this.getWorldPosition();
    this.plane.position.copyFrom(worldCenter);
    // when the reticle shouldn't be shown (clicking would be meaningless) it isn't pickable, so
    // it also drops the pointer cursor and can't be clicked
    const canShow = this.shouldShow();
    this.plane.isPickable = canShow;
    this.hovered = canShow && this.pointerIsWithinHoverThreshold(worldCenter);

    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * PULSE_FREQUENCY_HZ * (Date.now() / 1000));
    const color = Color3.Lerp(DARKER_YELLOW, LIGHTER_YELLOW, pulse);
    this.material.diffuseColor.copyFrom(color);
    this.material.emissiveColor.copyFrom(color);

    this.material.alpha = approachValue(
      this.material.alpha,
      this.hovered ? 1 : 0,
      ALPHA_LERP_PER_MS * deltaTime
    );
    const scale = approachValue(
      this.plane.scaling.x,
      this.hovered ? HOVERED_SCALE : 1,
      SCALE_LERP_PER_MS * deltaTime
    );
    this.plane.scaling.setAll(scale);
  }

  private pointerIsWithinHoverThreshold(worldCenter: Vector3): boolean {
    const centerScreen = this.projectToScreen(worldCenter);
    const screenRight = this.gameWorldView.camera.getDirection(Vector3.Right());
    const thresholdEdgeWorld = worldCenter.add(screenRight.scale(HOVER_THRESHOLD_WORLD_RADIUS));
    const thresholdInPixels = Vector2.Distance(
      centerScreen,
      this.projectToScreen(thresholdEdgeWorld)
    );
    const { scene } = this.gameWorldView;
    const pointerDistance = Vector2.Distance(
      centerScreen,
      new Vector2(scene.pointerX, scene.pointerY)
    );
    return pointerDistance <= thresholdInPixels;
  }

  private projectToScreen(worldPosition: Vector3): Vector2 {
    const { scene, camera, canvas } = this.gameWorldView;
    const projected = Vector3.Project(
      worldPosition,
      Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport
    );
    return new Vector2(projected.x * canvas.clientWidth, projected.y * canvas.clientHeight);
  }

  cleanup() {
    this.gameWorldView.scene.onPointerObservable.remove(this.pointerObserver);
    this.pointerObserver = null;
    this.plane.actionManager?.dispose();
    this.plane.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

function approachValue(current: number, target: number, maxDelta: number): number {
  if (current < target) {
    return Math.min(current + maxDelta, target);
  }
  return Math.max(current - maxDelta, target);
}
