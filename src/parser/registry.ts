import type { FeedUpdate, ItemUpdate } from "./phase";

const tagMap = new Map<
  string,
  {
    updater: FeedUpdate | ItemUpdate;
    children: string[];
  }
>();

export function register(parent: string, updater: FeedUpdate | ItemUpdate): void {
  tagMap.set(updater.tag, {
    updater,
    children: [],
  });

  const foundParent = tagMap.get(parent);
  if (foundParent) {
    foundParent.children.push(updater.tag);
  } else {
    console.warn(`Missing parent ${parent}, child tag may not parse as expected`);
  }
}

export function getChildParsers(
  tag: string
): Array<{
  updater: FeedUpdate | ItemUpdate;
  children: string[];
}> {
  const found = tagMap.get(tag);

  if (found) {
    return found.children.map((x) => tagMap.get(x)).filter(Boolean) as Array<{
      updater: FeedUpdate | ItemUpdate;
      children: string[];
    }>;
  }
  return [];
}
