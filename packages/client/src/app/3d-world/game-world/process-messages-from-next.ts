import {
  NextToBabylonMessage,
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";
import { GameWorld } from ".";

export default function processMessagesFromNext(this: GameWorld) {
  if (nextToBabylonMessageQueue.messages.length > 0) {
    const message = nextToBabylonMessageQueue.messages.shift();
    if (message === undefined) return;
    handleMessageFromNext(this, message);
  }
}

function handleMessageFromNext(gameWorld: GameWorld, message: NextToBabylonMessage) {
  switch (message.type) {
    case NextToBabylonMessageTypes.MoveCamera:
      if (!gameWorld.camera) return;
      const { radius, target, alpha, beta } = message;
      const { camera } = gameWorld;
      camera.target = target;
      camera.radius = radius;
      camera.alpha = alpha;
      camera.beta = beta;
  }
}
