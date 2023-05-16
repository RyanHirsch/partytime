import { ensureArray, getAttribute, getKnownAttribute, getText } from "../shared";
import type { XmlNode } from "../types";

export type Phase6TxtEntry = {
  value: string;
  purpose?: string;
};

export const txt = {
  phase: 6,
  tag: "podcast:txt",
  name: "txt",
  nodeTransform: ensureArray,
  // As long as one of the person tags has text, we'll consider it valid
  supportCheck: (node: XmlNode[]): boolean => node.some((n: XmlNode) => Boolean(getText(n))),
  fn(node: XmlNode[]): { podcastTxt: Phase6TxtEntry[] } {
    return {
      podcastTxt: node.map((n) => ({
        value: getText(n),
        ...(getAttribute(n, "purpose") ? { purpose: getKnownAttribute(n, "purpose") } : undefined),
      })),
    };
  },
};
