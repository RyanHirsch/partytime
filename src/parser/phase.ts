/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { concat, mergeDeepRight, mergeWith } from "ramda";
import { firstIfArray, getAttribute, getText } from "./shared";
import type { Episode, FeedObject, RSSFeed, TODO } from "./shared";
// ["podcast:location"];

interface PhaseUpdate {
  [p: number]: { [k: string]: boolean };
}

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

type FeedUpdate = {
  phase: number;
  tag: string;
  fn: (node: any) => Partial<FeedObject>;
  nodeTransform?: NodeTransform;
  supportCheck?: SupportCheck;
};
type ItemUpdate = {
  phase: number;
  tag: string;
  fn: (node: any) => Partial<Episode>;
  nodeTransform?: NodeTransform;
  supportCheck?: SupportCheck;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const defaultNodeTransform: NodeTransform = (x) => x;
const defaultSupportCheck: SupportCheck = (x) => typeof x === "object";

// #region Phase 1
const locked: FeedUpdate = {
  phase: 1,
  tag: "locked",
  fn(node) {
    const feedUpdate: Partial<FeedObject> = {};
    const lockedValues = ["yes", "true"];
    const lockedText = getText(node).toLowerCase();
    const owner = getAttribute(node, "owner");
    const email = getAttribute(node, "email");

    if (lockedValues.includes(lockedText)) {
      feedUpdate.podcastLocked = 1;
    }
    if (owner) {
      feedUpdate.podcastOwner = owner;
    }
    if (email) {
      feedUpdate.podcastOwner = email;
    }
    return feedUpdate;
  },
};

const transcript: ItemUpdate = {
  phase: 1,
  tag: "transcript",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getAttribute(node, "url")),
  fn(node) {
    const itemUpdate: Partial<Episode> = {};
    const url = getAttribute(node, "url");

    if (url) {
      itemUpdate.podcastTranscripts = {
        url,
        type: 0,
      };
    }
    return itemUpdate;
  },
};

const funding: FeedUpdate = {
  phase: 1,
  tag: "funding",
  fn(node) {
    const feedUpdate: Partial<FeedObject> = {};

    const message = getText(node);
    const url = getAttribute(node, "url");

    if (url) {
      feedUpdate.podcastFunding = {
        message: message ?? "",
        url,
      };
    }
    return feedUpdate;
  },
};
// #endregion

// #region Phase 2
const person: FeedUpdate | ItemUpdate = {
  phase: 2,
  tag: "person",
  supportCheck: (node: TODO) => Boolean(getText(node)),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update: Partial<FeedObject> | Partial<Episode> = {};
    const name = getText(node);
    const openStreetMaps = getAttribute(node, "osm");
    const geoUri = getAttribute(node, "geo");
    if (name) {
      update.podcastLocation = {
        name,
      };

      if (openStreetMaps) {
        update.podcastLocation.osm = openStreetMaps;
      }

      if (geoUri) {
        update.podcastLocation.geo = geoUri;
      }
    }
    return update;
  },
};
const location: FeedUpdate | ItemUpdate = {
  phase: 2,
  tag: "location",
  supportCheck: (node: TODO) => Boolean(getText(node)),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update: Partial<FeedObject> | Partial<Episode> = {};
    const name = getText(node);
    const openStreetMaps = getAttribute(node, "osm");
    const geoUri = getAttribute(node, "geo");
    if (name) {
      update.podcastLocation = {
        name,
      };

      if (openStreetMaps) {
        update.podcastLocation.osm = openStreetMaps;
      }

      if (geoUri) {
        update.podcastLocation.geo = geoUri;
      }
    }
    return update;
  },
};
// #endregion

const feeds: FeedUpdate[] = [locked, funding, person, location];

const items: ItemUpdate[] = [transcript, person, location];

export function updateFeed(theFeed: RSSFeed): FeedUpdateResult {
  return feeds.reduce(
    ({ feedUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const node = (nodeTransform ?? defaultNodeTransform)(theFeed.rss.channel[`podcast:${tag}`]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if ((supportCheck ?? defaultSupportCheck)(node)) {
        return {
          feedUpdate: mergeWith(concat, feedUpdate, fn(node)),
          phaseUpdate: mergeDeepRight(phaseUpdate, { [phase]: { [tag]: true } }),
        };
      }
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

export function updateItem(item: TODO): ItemUpdateResult {
  return items.reduce(
    ({ itemUpdate, phaseUpdate }, { phase, tag, fn, nodeTransform, supportCheck }) => {
      const node = (nodeTransform ?? defaultNodeTransform)(item[`podcast:${tag}`]);

      if ((supportCheck ?? defaultSupportCheck)(node)) {
        return {
          itemUpdate: mergeWith(concat, itemUpdate, fn(node)),
          phaseUpdate: mergeDeepRight(phaseUpdate, { [phase]: { [tag]: true } }),
        };
      }
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
