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
