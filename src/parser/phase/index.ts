/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { concat, mergeDeepRight, mergeWith } from "ramda";
import log from "loglevel";

import type { Episode, FeedObject, RSSFeed, TODO, PhaseUpdate } from "../shared";

import * as phase1 from "./phase-1";
import * as phase2 from "./phase-2";

type FeedUpdateResult = {
  feedUpdate: Partial<FeedObject>;
  phaseUpdate: PhaseUpdate;
};

type ItemUpdateResult = {
  itemUpdate: Partial<Episode>;
  phaseUpdate: PhaseUpdate;
};

type NodeTransform = (x: TODO) => TODO;
type SupportCheck = (x: TODO) => boolean;

export type FeedUpdate = {
  phase: number;
  tag: string;
  fn: (node: any) => Partial<FeedObject>;
  nodeTransform?: NodeTransform;
  supportCheck?: SupportCheck;
};

export type ItemUpdate = {
  phase: number;
  tag: string;
  fn: (node: any, feed?: RSSFeed) => Partial<Episode>;
  nodeTransform?: NodeTransform;
  supportCheck?: SupportCheck;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const defaultNodeTransform: NodeTransform = (x) => x;
export const defaultSupportCheck: SupportCheck = (x) => typeof x === "object";

const feeds: FeedUpdate[] = [phase1.locked, phase1.funding, phase2.person, phase2.location];

const items: ItemUpdate[] = [
  phase1.transcript,
  phase1.chapters,
  phase1.soundbite,

  phase2.person,
  phase2.location,
  phase2.season,
  phase2.episode,
];

export function updateFeed(theFeed: RSSFeed): FeedUpdateResult {
  return feeds.reduce(
    ({ feedUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const node = (nodeTransform ?? defaultNodeTransform)(theFeed.rss.channel[`podcast:${tag}`]);
      const tagSupported = (supportCheck ?? defaultSupportCheck)(node);

      if (tagSupported) {
        return {
          feedUpdate: mergeWith(concat, feedUpdate, fn(node)),
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

export function updateItem(item: TODO, feed: RSSFeed): ItemUpdateResult {
  return items.reduce(
    ({ itemUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      const node = (nodeTransform ?? defaultNodeTransform)(item[`podcast:${tag}`]);
      const tagSupported = (supportCheck ?? defaultSupportCheck)(node);

      if (tagSupported) {
        return {
          itemUpdate: mergeWith(concat, itemUpdate, fn(node, feed)),
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
