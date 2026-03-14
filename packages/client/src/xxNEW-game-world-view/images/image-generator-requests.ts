import { Item } from "@speed-dungeon/common";

export enum ImageGenerationRequestType {
  ItemCreation,
  ItemDeletion,
  ClearState,
}

export interface ImageGenerationRequestMap {
  [ImageGenerationRequestType.ItemCreation]: { item: Item };
  [ImageGenerationRequestType.ItemDeletion]: {
    itemIds: string[];
  };
  [ImageGenerationRequestType.ClearState]: undefined;
}

export type ImageGenerationRequest = {
  [K in keyof ImageGenerationRequestMap]: {
    type: K;
    data: ImageGenerationRequestMap[K];
  };
}[keyof ImageGenerationRequestMap];

export type ImageGenerationRequestHandler<K extends keyof ImageGenerationRequestMap> = (
  data: ImageGenerationRequestMap[K]
) => void | Promise<void>;

export type ImageGenerationRequestHandlers = {
  [K in keyof ImageGenerationRequestMap]: ImageGenerationRequestHandler<K>;
};
