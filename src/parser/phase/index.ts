/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import concat from "ramda/src/concat";
import mergeDeepRight from "ramda/src/mergeDeepRight";
import mergeWith from "ramda/src/mergeWith";
import log from "loglevel";

import type { Episode, FeedObject, RSSFeed, XmlNode, PhaseUpdate, TODO } from "../types";

import * as phase1 from "./phase-1";
import * as phase2 from "./phase-2";
import * as phase3 from "./phase-3";
import * as phase4 from "./phase-4";
import * as pending from "./phase-pending";
import { XmlNodeSource } from "./types";

type FeedUpdateResult = {
  feedUpdate: Partial<FeedObject>;
  phaseUpdate: PhaseUpdate;
};

type ItemUpdateResult = {
  itemUpdate: Partial<Episode>;
  phaseUpdate: PhaseUpdate;
};

type NodeTransform = (x: XmlNode) => TODO;
type SupportCheck = (x: TODO, type: XmlNodeSource) => boolean;

/** Describes a Feed processing object intended to provide extensible feed parsing */
export type FeedUpdate = {
  /** What phase was this added to the namespace */
  phase: number;
  /** What is the name of the tag, expected to "transcript" for <podcast:transcript> */
  tag: string;
  /** Processing function to return an object to be merged with the current feed */
  fn: (node: XmlNode, feed: RSSFeed, type: XmlNodeSource) => Partial<FeedObject>;
  /** An optional function to transform the node before calling both the support and processing functions */
  nodeTransform?: NodeTransform;
  /** An optional function to determine if the tag meets the requirements for processing (eg. has required attributes or value) */
  supportCheck?: SupportCheck;
};

/** Describes an Item processing object intended to provide extensible item parsing */
export type ItemUpdate = {
  /** What phase was this added to the namespace */
  phase: number;
  /** What is the name of the tag, expected to "transcript" for <podcast:transcript> */
  tag: string;
  /** Processing function to return an object to be merged with the current item */
  fn: (node: XmlNode, feed: RSSFeed, type: XmlNodeSource) => Partial<Episode>;
  /** An optional function to transform the node before calling both the support and processing functions */
  nodeTransform?: NodeTransform;
  /** An optional function to determine if the tag meets the requirements for processing (eg. has required attributes or value) */
  supportCheck?: SupportCheck;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const defaultNodeTransform: NodeTransform = (x) => x;
export const defaultSupportCheck: SupportCheck = (x) => typeof x === "object";

const feeds: FeedUpdate[] = [
  phase1.locked,
  phase1.funding,

  phase2.person,
  phase2.location,

  phase3.trailer,
  phase3.license,
  phase3.guid,

  phase4.value,

  pending.id,
];

const items: ItemUpdate[] = [
  phase1.transcript,
  phase1.chapters,
  phase1.soundbite,

  phase2.person,
  phase2.location,
  phase2.season,
  phase2.episode,

  phase3.license,
  phase3.alternativeEnclosure,

  phase4.value,
];

export function updateFeed(theFeed: RSSFeed, feedUpdates = feeds): FeedUpdateResult {
  return feedUpdates.reduce(
    ({ feedUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const node = (nodeTransform ?? defaultNodeTransform)(theFeed.rss.channel[`podcast:${tag}`]);
      const tagSupported = node && (supportCheck ?? defaultSupportCheck)(node, XmlNodeSource.Feed);

      if (tagSupported) {
        return {
          feedUpdate: mergeWith(concat, feedUpdate, fn(node, theFeed, XmlNodeSource.Feed)),
          phaseUpdate: mergeDeepRight(phaseUpdate, { [phase]: { [tag]: true } }),
        };
      }

      log.debug(`Feed doesn't support ${tag}`, node, tagSupported);
      return {
        feedUpdate,
        phaseUpdate,
      };
    },
    {
      feedUpdate: {},
      phaseUpdate: {},
    } as FeedUpdateResult
  );
}

export function updateItem(item: XmlNode, feed: RSSFeed, itemUpdates = items): ItemUpdateResult {
  return itemUpdates.reduce(
    ({ itemUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      const node = (nodeTransform ?? defaultNodeTransform)(item[`podcast:${tag}`]);
      const tagSupported = node && (supportCheck ?? defaultSupportCheck)(node, XmlNodeSource.Item);

      if (tagSupported) {
        return {
          itemUpdate: mergeWith(concat, itemUpdate, fn(node, feed, XmlNodeSource.Item)),
          phaseUpdate: mergeDeepRight(phaseUpdate, { [phase]: { [tag]: true } }),
        };
      }
      log.debug(`Feed item doesn't support ${tag}`, node, tagSupported);
      return {
        itemUpdate,
        phaseUpdate,
      };
    },
    {
      itemUpdate: {},
      phaseUpdate: {},
    } as ItemUpdateResult
  );
}
