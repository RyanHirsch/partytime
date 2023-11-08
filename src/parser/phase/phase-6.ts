import {
  ensureArray,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
  lookup,
} from "../shared";
import type { XmlNode } from "../types";

import { Phase4Medium, Phase4ValueRecipient } from "./phase-4";
import { addSubTag } from "./helpers";
import { extractRecipients } from "./value-helpers";

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
  feedGuid: string;
  itemGuid?: string;
  feedUrl?: string;
  medium?: Phase4Medium;
};

export const remoteItem = {
  phase: 6,
  // eslint-disable-next-line sonarjs/no-duplicate-string
  tag: "podcast:remoteItem",
  name: "remoteItem",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => getAttribute(n, "feedGuid")),
  supportCheck: (nodes: XmlNode[]): boolean => nodes.length > 0,
  fn(nodes: XmlNode[]): { podcastRemoteItems: Phase6RemoteItem[] } {
    return {
      podcastRemoteItems: nodes.map((n) => ({
        feedGuid: getKnownAttribute(n, "feedGuid"),
        ...extractOptionalStringAttribute(n, "itemGuid"),
        ...extractOptionalStringAttribute(n, "feedUrl"),
        ...(getAttribute(n, "medium")
          ? { medium: lookup(Phase4Medium, getKnownAttribute(n, "medium")) }
          : undefined),
      })),
    };
  },
};

addSubTag("liveItem", remoteItem);

type ValueTimeSplitBase = {
  /** time in seconds for the current item where the value split begins */
  startTime: number;
  /** time in seconds for how long the split lasts */
  duration: number;
};
type RemoteItemValueTimeSplit = ValueTimeSplitBase & {
  /** The time in the remote item where the value split begins. Allows the timestamp to be set correctly in value metadata. If not defined, defaults to 0 */
  remoteStartTime: number;
  /** the percentage of the payment the remote recipients will receive if a <podcast:remoteItem> is present. If not defined, defaults to 100. If the value is less than 0, 0 is assumed. If the value is greater than 100, 100 is assumed */
  remotePercentage: number;
  remoteItem: Phase6RemoteItem;
  type: "remoteItem";
};
type RecipientItemValueTimeSplit = ValueTimeSplitBase & {
  recipients: Phase4ValueRecipient[];
  type: "recipients";
};

export type Phase6ValueTimeSplit = RemoteItemValueTimeSplit | RecipientItemValueTimeSplit;

export const valueTimeSplit = {
  phase: 6,
  tag: "podcast:valueTimeSplit",
  name: "valueTimeSplit",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => {
      const startTime = getAttribute(n, "startTime");
      const duration = getAttribute(n, "duration");

      return (
        startTime &&
        duration &&
        !Number.isNaN(parseFloat(startTime)) &&
        !Number.isNaN(parseFloat(duration))
      );
    }),
  supportCheck: (nodes: XmlNode[]): boolean => nodes.length > 0,
  fn(nodes: XmlNode[]): { valueTimeSplits: Phase6ValueTimeSplit[] } {
    return {
      valueTimeSplits: nodes.map((n) => {
        const split: ValueTimeSplitBase = {
          startTime: parseFloat(getKnownAttribute(n, "startTime")),
          duration: parseFloat(getKnownAttribute(n, "duration")),
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const r = remoteItem.nodeTransform(n[remoteItem.tag]);
        if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          remoteItem.supportCheck(r)
        ) {
          const { podcastRemoteItems } = remoteItem.fn(r);

          const remotePercentage = Math.min(
            parseFloat(getAttribute(n, "remotePercentage") ?? "100"),
            100
          );
          const remoteStartTime = Math.max(
            parseFloat(getAttribute(n, "remoteStartTime") ?? "0"),
            0
          );
          return {
            type: "remoteItem",
            ...split,
            remoteStartTime,
            remotePercentage,
            remoteItem: podcastRemoteItems[0],
          } as RemoteItemValueTimeSplit;
        }
        return {
          type: "recipients",
          ...split,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          recipients: extractRecipients(ensureArray(n["podcast:valueRecipient"])),
        } as RecipientItemValueTimeSplit;
      }),
    };
  },
};

addSubTag("value", valueTimeSplit);

export const podroll = {
  phase: 6,
  tag: "podcast:podroll",
  name: "podroll",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const extractedRemoteItem = n["podcast:remoteItem"];
      return extractedRemoteItem && remoteItem.nodeTransform(extractedRemoteItem).length > 0;
    }),
  supportCheck: (nodes: XmlNode[]): boolean => nodes.length > 0,
  fn(nodes: XmlNode[]): { podroll: Phase6RemoteItem[] } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const extractedRemoteItems = remoteItem.nodeTransform(nodes[0]["podcast:remoteItem"]);

    return {
      podroll: remoteItem.fn(extractedRemoteItems).podcastRemoteItems,
    };
  },
};
