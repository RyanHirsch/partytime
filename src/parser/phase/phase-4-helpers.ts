import type { ItemUpdate } from "./index";

// eslint-disable-next-line sonarjs/no-unused-collection
export const litSubTags: ItemUpdate[] = [];

export function addLitSubTag<T>(processor: ItemUpdate<T>): void {
  litSubTags.push(processor);
}
