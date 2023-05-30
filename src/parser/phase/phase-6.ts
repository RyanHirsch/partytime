import {
  ensureArray,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
  lookup,
} from "../shared";
import type { XmlNode } from "../types";

import { Phase4Medium } from "./phase-4";
import { addLitSubTag } from "./phase-4-helpers";

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

export type Phase6RemoteItem = {
  itemGuid: string;
  feedGuid: string;
  feedUrl?: string;
  medium?: Phase4Medium;
};

export const remoteItem = {
  phase: 6,
  tag: "podcast:remoteItem",
  name: "remoteItem",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => getAttribute(n, "itemGuid") && getAttribute(n, "feedGuid")),
  supportCheck: (nodes: XmlNode[]): boolean => nodes.length > 0,
  fn(nodes: XmlNode[]): { podcastRemoteItems: Phase6RemoteItem[] } {
    return {
      podcastRemoteItems: nodes.map((n) => ({
        itemGuid: getKnownAttribute(n, "itemGuid"),
        feedGuid: getKnownAttribute(n, "feedGuid"),
        ...extractOptionalStringAttribute(n, "feedUrl"),
        ...(getAttribute(n, "medium")
          ? { medium: lookup(Phase4Medium, getKnownAttribute(n, "medium")) }
          : undefined),
      })),
    };
  },
};

addLitSubTag(remoteItem);
