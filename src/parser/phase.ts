/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { concat, mergeDeepRight, mergeWith } from "ramda";
import log from "loglevel";

import {
  ensureArray,
  firstIfArray,
  getAttribute,
  getNumber,
  getText,
  Person,
  PodcastEpisodeNumber,
  PodcastSeasonNumber,
  SoundBite,
  Transcript,
  TranscriptType,
} from "./shared";
import type { Episode, FeedObject, RSSFeed, TODO, PhaseUpdate } from "./shared";
import { PersonGroup, PersonRole } from "./person-enum";

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
  supportCheck: (node) => Boolean(getAttribute(firstIfArray(node), "url")),
  fn(node, feed) {
    const itemUpdate = { podcastTranscripts: [] as Transcript[] };

    ensureArray(node).forEach((transcriptNode) => {
      const feedLanguage: string = feed ? feed.rss.channel.language : null;
      const url = getAttribute(transcriptNode, "url");
      const type = getAttribute(transcriptNode, "type");
      const language = getAttribute(transcriptNode, "language") || feedLanguage;

      const rel = getAttribute(transcriptNode, "rel");

      if (url && type) {
        const transcriptValue: Transcript = {
          url,
          type: type as TranscriptType,
        };

        if (language) {
          transcriptValue.language = language;
        }

        if (rel) {
          transcriptValue.rel = "captions";
        }

        itemUpdate.podcastTranscripts.push(transcriptValue);
      }
    });

    return itemUpdate;
  },
};

export const funding: FeedUpdate = {
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

export const chapters: ItemUpdate = {
  phase: 1,
  tag: "chapters",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getAttribute(node, "url")),
  fn(node) {
    const itemUpdate: Partial<Episode> = {};
    const url = getAttribute(node, "url");

    if (url) {
      itemUpdate.podcastChapters = {
        url,
        type: 0,
      };
    }
    return itemUpdate;
  },
};

export const soundbite: ItemUpdate = {
  phase: 1,
  tag: "soundbite",
  supportCheck: (node) =>
    ensureArray(node).some((n) => getAttribute(n, "duration") && getAttribute(n, "startTime")),
  fn(node) {
    const itemUpdate = { podcastSoundbites: [] as SoundBite[] };

    ensureArray(node).forEach((soundbiteNode) => {
      const duration = getAttribute(soundbiteNode, "duration");
      const startTime = getAttribute(soundbiteNode, "startTime");
      const title = getText(soundbiteNode);

      if (duration && startTime) {
        const bite: SoundBite = {
          duration,
          startTime,
        };
        if (title) {
          bite.title = title;
        }
        itemUpdate.podcastSoundbites.push(bite);
      }
    });

    return {};
  },
};
// #endregion

// #region Phase 2
export const person: FeedUpdate | ItemUpdate = {
  phase: 2,
  tag: "person",
  // As long as one of the person tags has text, well consider it valid
  supportCheck: (node) => ensureArray(node).some((n) => Boolean(getText(n))),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update = {
      podcastPersons: [] as Person[],
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
          personObj.img = img;
        }
        if (href) {
          personObj.href = href;
        }

        update.podcastPersons.push(personObj);
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

export const season: ItemUpdate = {
  phase: 2,
  tag: "season",
  supportCheck: (node) => Boolean(getNumber(node)),
  fn(node) {
    const itemUpdate = {
      podcastSeason: {
        number: getNumber(node),
      } as PodcastSeasonNumber,
    };

    const name = getAttribute(node, "name");
    if (name) {
      itemUpdate.podcastSeason.name = name;
    }

    return itemUpdate;
  },
};

export const episode: ItemUpdate = {
  phase: 2,
  tag: "episode",
  supportCheck: (node) => Boolean(getNumber(node)),

  fn(node) {
    const itemUpdate = {
      podcastEpisode: {
        number: getNumber(node),
      } as PodcastEpisodeNumber,
    };

    const display = getAttribute(node, "display");
    if (display) {
      itemUpdate.podcastEpisode.display = display;
    }

    return itemUpdate;
  },
};

// #endregion

const feeds: FeedUpdate[] = [
  // Phase 1
  locked,
  funding,
  // Phase 2
  person,
  location,
  // Phase 3
];

const items: ItemUpdate[] = [
  // Phase 1
  transcript,
  chapters,
  soundbite,
  // Phase 2
  person,
  location,
  season,
  episode,
  // Phase 3
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
