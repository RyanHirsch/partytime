/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ensureArray, firstIfArray, getAttribute, getKnownAttribute, getText } from "../shared";

import type { FeedObject, XmlNode } from "../types";
import type { FeedUpdate, ItemUpdate } from "./index";
import { log } from "../../logger";

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#locked
 *
 * This tag may be set to yes or no. The purpose is to tell other podcast platforms whether they are
 * allowed to import this feed. A value of yes means that any attempt to import this feed into a new
 * platform should be rejected.
 */
export const locked: FeedUpdate = {
  phase: 1,
  tag: "locked",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getAttribute(node, "owner")),
  fn(node) {
    log.info("locked");

    const feedUpdate: Partial<FeedObject> = {};
    const lockedText = getText(node).toLowerCase();
    const owner = getAttribute(node, "owner");

    log.debug(`- Owner: ${owner ?? ""}`);
    log.debug(`- Locked: ${lockedText}`);

    if (["yes", "true"].includes(lockedText)) {
      feedUpdate.locked = true;
    } else if (["no", "false"].includes(lockedText)) {
      feedUpdate.locked = false;
    }

    if (owner) {
      feedUpdate.podcastOwner = owner;
    }

    return feedUpdate;
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#transcript
 *
 * This tag is used to link to a transcript or closed captions file. Multiple tags can be present for
 * multiple transcript formats.
 */
export type Phase1Transcript = {
  /** URL of the podcast transcript */
  url: string;
  /** Mime type of the file such as text/plain, text/html, application/srt, text/vtt, application/json */
  type: TranscriptType;
  /** The language of the linked transcript. If there is no language attribute given, the linked file is assumed to be the same language that is specified by the RSS <language> element. */
  language?: string;
  /**  If the rel="captions" attribute is present, the linked file is considered to be a closed captions file, regardless of what the mime type is. In that scenario, time codes are assumed to be present in the file in some capacity. */
  rel?: "captions";
};
enum TranscriptType {
  Plain = "text/plain",
  HTML = "text/html",
  SRT = "application/srt",
  JSON = "application/json",
}

export const transcript: ItemUpdate = {
  phase: 1,
  tag: "transcript",
  nodeTransform: ensureArray,
  supportCheck: (node) =>
    (node as XmlNode[]).some(
      (transcriptNode) =>
        Boolean(getAttribute(transcriptNode, "url")) &&
        Boolean(getAttribute(transcriptNode, "type"))
    ),
  fn(node, feed) {
    log.info("transcript");

    const itemUpdate = { podcastTranscripts: [] as Phase1Transcript[] };

    (node as XmlNode[]).forEach((transcriptNode) => {
      const feedLanguage: string = feed ? feed.rss.channel.language : null;
      const url = getAttribute(transcriptNode, "url");
      const type = getAttribute(transcriptNode, "type") as TranscriptType;
      const language = getAttribute(transcriptNode, "language") || feedLanguage;

      const rel = getAttribute(transcriptNode, "rel");

      log.debug(`- Feed Language: ${feedLanguage}`);
      log.debug(`- URL: ${url ?? "<null>"}`);
      log.debug(`- Type: ${type}`);
      log.debug(`- Language: ${language}`);
      log.debug(`- Rel: ${rel ?? "<null>"}`);

      if (url && type) {
        const transcriptValue: Phase1Transcript = {
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

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#funding
 *
 * This tag lists possible donation/funding links for the podcast. The content of the tag is the recommended
 * string to be used with the link.
 */
export type Phase1Funding = {
  message: string;
  url: string;
};
export const funding: FeedUpdate = {
  phase: 1,
  tag: "funding",
  nodeTransform: firstIfArray,
  fn(node) {
    log.info("funding");

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

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#chapters
 *
 * Links to an external file containing chapter data for the episode.
 */
export type Phase1Chapter = {
  /** The URL where the chapters file is located */
  url: string;
  /** Mime type of file - JSON prefered, 'application/json+chapters' */
  type: string;
};
export const chapters: ItemUpdate = {
  phase: 1,
  tag: "chapters",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getAttribute(node, "url")) && Boolean(getAttribute(node, "type")),
  fn(node) {
    log.info("chapters");

    return {
      podcastChapters: {
        url: getKnownAttribute(node, "url"),
        type: getKnownAttribute(node, "type"),
      },
    };
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#soundbite
 *
 * Points to one or more soundbites within a podcast episode. The intended use includes episodes previews,
 * discoverability, audiogram generation, episode highlights, etc. It should be assumed that the
 * audio/video source of the soundbite is the audio/video given in the item's <enclosure> element.
 */
export type Phase1SoundBite = {
  /**  How long is the soundbite (recommended between 15 and 120 seconds) */
  duration: number;
  /** The time where the soundbite begins */
  startTime: number;
  /** The title of the soundbite, if one isn't provided it will fallback to the title of the episode */
  title: string;
};
export const soundbite: ItemUpdate = {
  phase: 1,
  tag: "soundbite",
  nodeTransform: ensureArray,
  supportCheck: (node) =>
    (node as XmlNode[]).some((n) => getAttribute(n, "duration") && getAttribute(n, "startTime")),
  fn(node, feed) {
    log.info("soundbite");

    const itemUpdate = { podcastSoundbites: [] as Phase1SoundBite[] };

    (node as XmlNode[]).forEach((soundbiteNode: XmlNode) => {
      const duration = parseFloat(getKnownAttribute(soundbiteNode, "duration"));
      const startTime = parseFloat(getKnownAttribute(soundbiteNode, "startTime"));
      const title = getText(soundbiteNode);

      if (duration && startTime) {
        const bite: Phase1SoundBite = {
          duration,
          startTime,
          title: title || ((feed.rss.channel.title as string) ?? "").trim(),
        };

        itemUpdate.podcastSoundbites.push(bite);
      }
    });

    return itemUpdate;
  },
};
