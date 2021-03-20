/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { concat, mergeDeepRight, mergeWith } from "ramda";
import { ensureArray, firstIfArray, getAttribute, getText, Person } from "./shared";
import type { Episode, FeedObject, RSSFeed, TODO, PhaseUpdate } from "./shared";
import { PersonGroup, PersonRole } from "./person-enum";
// ["podcast:location"];

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
  fn: (node: any) => Partial<Episode>;
  nodeTransform?: NodeTransform;
  supportCheck?: SupportCheck;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const defaultNodeTransform: NodeTransform = (x) => x;
export const defaultSupportCheck: SupportCheck = (x) => typeof x === "object";

// #region Phase 1
export const locked: FeedUpdate = {
  phase: 1,
  tag: "locked",
  fn(node) {
    const feedUpdate: Partial<FeedObject> = {};
    const lockedValues = ["yes", "true"];
    const lockedText = getText(node).toLowerCase();
    const owner = getAttribute(node, "owner");

    if (lockedValues.includes(lockedText)) {
      feedUpdate.podcastLocked = 1;
    }
    if (owner) {
      feedUpdate.podcastOwner = owner;
    }

    return feedUpdate;
  },
};

export const transcript: ItemUpdate = {
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
  // As long as one of the person tags has text, well consider it valid
  supportCheck: (node) => ensureArray(node).some((n) => Boolean(getText(n))),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update = {
      podcastPeople: [] as Person[],
    };

    const groups = Object.values(PersonGroup);
    const roles = Object.values(PersonRole);

    ensureArray(node).forEach((personNode) => {
      const name = getText(personNode);
      const role =
        roles.find((r) => r.toLowerCase() === getAttribute(personNode, "role")?.toLowerCase()) ??
        PersonRole.Host;
      const group =
        groups.find((g) => g.toLowerCase() === getAttribute(personNode, "group")?.toLowerCase()) ??
        PersonGroup.Cast;
      const img = getAttribute(personNode, "img");
      const href = getAttribute(personNode, "href");

      if (name) {
        const personObj: Person = {
          name,
          role,
          group,
        };

        if (img) {
          personObj.image = img;
        }
        if (href) {
          personObj.href = href;
        }

        update.podcastPeople.push(personObj);
      }
    });

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
