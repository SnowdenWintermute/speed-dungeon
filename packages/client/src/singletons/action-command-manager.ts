import { ClientActionCommandReceiver } from "@/app/client-action-command-receiver";
import { ActionCommandQueue } from "@speed-dungeon/common";

export const actionCommandReceiver = new ClientActionCommandReceiver();
export const actionCommandQueue = new ActionCommandQueue();
