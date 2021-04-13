/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ensureArray, firstIfArray, getAttribute, getText } from "../shared";

import type { Episode, FeedObject, SoundBite, Transcript, TranscriptType } from "../shared";
import type { FeedUpdate, ItemUpdate } from "./index";

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
      const type = getAttribute(transcriptNode, "type") as TranscriptType;
      const language = getAttribute(transcriptNode, "language") || feedLanguage;

      const rel = getAttribute(transcriptNode, "rel");

      if (url && type) {
        const transcriptValue: Transcript = {
          url,
          type,
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
