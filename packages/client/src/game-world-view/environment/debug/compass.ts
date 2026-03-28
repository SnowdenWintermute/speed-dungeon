import { DynamicTexture, ICanvasRenderingContext, Vector2 } from "@babylonjs/core";
import { GROUND_TEXTURE_HEIGHT, GROUND_TEXTURE_WIDTH } from "../../game-world-view-consts";
import { FFIX_COLORS } from "@speed-dungeon/common/src/app-consts";

class CardinalPoints2 {
  constructor(
    readonly north: Vector2,
    readonly east: Vector2,
    readonly south: Vector2,
    readonly west: Vector2
  ) {}
}

export class DebugCompassDrawer {
  context: ICanvasRenderingContext;
  private radius = 500;
  private center: Vector2;
  private points: CardinalPoints2;
  constructor(private texture: DynamicTexture) {
    this.context = texture.getContext();

    this.context.lineWidth = 10;
    this.context.font = "50px sans-serif";
    this.context.fillStyle = "#FFF";

    this.center = new Vector2(GROUND_TEXTURE_WIDTH / 2, GROUND_TEXTURE_HEIGHT / 2);
    this.points = new CardinalPoints2(
      new Vector2(this.center.x, this.center.y - this.radius),
      new Vector2(this.center.x + this.radius, this.center.y),
      new Vector2(this.center.x, this.center.y + this.radius),
      new Vector2(this.center.x - this.radius, this.center.y)
    );
  }

  draw() {
    this.drawCenter();
    const { north, east, south, west } = this.points;

    this.drawDirection(west, "N (-Z)", FFIX_COLORS.windgreen);
    this.drawDirection(east, "E (+X)", FFIX_COLORS.earthyellow);
    this.drawDirection(north, "W (-X)", FFIX_COLORS.firered);
    this.drawDirection(south, "S (+Z)", FFIX_COLORS.waterblue);

    this.texture.update();
  }

  private drawCenter() {
    const { context } = this;
    context.beginPath();
    const { x, y } = this.center;
    context.arc(x, y, 100, 0, Math.PI * 2);
    context.strokeStyle = "#FFF";
    context.stroke();

    context.moveTo(x, x);
    context.beginPath();
    context.arc(x, x, 10, 0, Math.PI * 2);
    context.fillStyle = "#000";
    context.fill();
  }

  private drawDirection(point: Vector2, text: string, color: string) {
    const { context } = this;
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(this.center.x, this.center.y);
    context.stroke();
    context.fillStyle = "lightgrey";
    context.fillText(text, point.x, point.y);
  }
}
