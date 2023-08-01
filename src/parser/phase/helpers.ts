import type { RSSFeed, XmlNode } from "../types";

import { XmlNodeSource } from "./types";

import type { ItemUpdate } from "./index";

const map = new Map<string, ItemUpdate[]>();

export function addSubTag<T>(parentTag: string, processor: ItemUpdate<T>): void {
  const existing = map.get(parentTag);

  if (existing) {
    existing.push(processor);
  } else {
    map.set(parentTag, [processor]);
  }
}

export function getSubTags(tag: string): ItemUpdate[] {
  return map.get(tag) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const defaultNodeTransform = (x: XmlNode): XmlNode => x;
const defaultSupportCheck = (x: XmlNode): boolean => typeof x === "object";
export function useParser<T extends Record<string, unknown>>(
  itemUpdate: ItemUpdate,
  n: XmlNode,
  item: T
): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const nodeContents = n[itemUpdate.tag];
  if (nodeContents) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const transformedNode = (itemUpdate.nodeTransform ?? defaultNodeTransform)(nodeContents);
    if (
      transformedNode &&
      (itemUpdate.supportCheck ?? defaultSupportCheck)(transformedNode, XmlNodeSource.Item)
    ) {
      Object.assign(item, itemUpdate.fn(transformedNode, {} as RSSFeed, XmlNodeSource.Item));
    }
  }
}
