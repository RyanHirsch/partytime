/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { logger } from "../../logger";
import {
  ensureArray,
  extractOptionalFloatAttribute,
  firstIfArray,
  getAttribute,
  getKnownAttribute,
  getText,
  knownLookup,
  lookup,
  lookupCaseInsensitive,
  pubDateToDate,
} from "../shared";
import type { EmptyObj, Episode, XmlNode } from "../types";
import * as ItemParser from "../item";

import { addSubTag, getSubTags, useParser } from "./helpers";
import type { PhasePendingLiveUpdates } from "./phase-pending";
import type { Phase7Chat } from "./phase-7";
import { extractRecipients, validRecipient } from "./value-helpers";
import type { Phase6ValueTimeSplit } from "./phase-6";

import type { FeedUpdate } from "./index";

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#value
 *
 * This element designates the cryptocurrency or payment layer that will be used, the transport method for
 * transacting the payments, and a suggested amount denominated in the given cryptocurrency.
 *
 * Also see: https://github.com/Podcastindex-org/podcast-namespace/blob/main/value/value.md
 */
export type Phase4Value = {
  /**
   * This is the service slug of the cryptocurrency or protocol layer.
   *
   * lightning
   */
  type: string;
  /** This is the transport mechanism that will be used. keysend and amp are the only expected values */
  method: string;
  /** This is an optional suggestion on how much cryptocurrency to send with each payment. */
  suggested?: string;
  recipients: Phase4ValueRecipient[];
  valueTimeSplits?: Phase6ValueTimeSplit[];
};

export type Phase4ValueRecipient = {
  /** A free-form string that designates who or what this recipient is. */
  name?: string;
  /** The name of a custom record key to send along with the payment. */
  customKey?: string;
  /** A custom value to pass along with the payment. This is considered the value that belongs to the customKey. */
  customValue?: string;
  /** A slug that represents the type of receiving address that will receive the payment. */
  type: string;
  /** This denotes the receiving address of the payee. */
  address: string;
  /** The number of shares of the payment this recipient will receive. */
  split: number;
  fee: boolean;
};
export const value = {
  phase: 4,
  tag: "podcast:value",
  name: "value",
  nodeTransform: firstIfArray,
  supportCheck: (node: XmlNode): boolean =>
    Boolean(getAttribute(node, "type")) &&
    Boolean(getAttribute(node, "method")) &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ensureArray(node["podcast:valueRecipient"]).filter(validRecipient).length > 0,
  fn(node: XmlNode): { value: Phase4Value } {
    const item = {};
    getSubTags("value").forEach((updater) => {
      useParser(updater, node, item);
    });

    return {
      value: {
        type: getKnownAttribute(node, "type"),
        method: getKnownAttribute(node, "method"),
        ...extractOptionalFloatAttribute(node, "suggested"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        recipients: extractRecipients(ensureArray(node["podcast:valueRecipient"])),
        ...item,
      },
    };
  },
};
addSubTag("liveItem", value);

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#medium
 *
 */

export enum Phase4Medium {
  /** Describes a feed for a podcast show. If no medium tag is present in the channel, this medium is assumed. */
  Podcast = "podcast",
  /** A feed of music organized into an "album" with each item a song within the album */
  Music = "music",
  /** Like a "podcast" but used in a more visual experience. Something akin to a dedicated video channel like would be found on YouTube */
  Video = "video",
  /** Specific types of videos with one item per feed. This is different than a video medium because the content is considered to be cinematic; like a movie or documentary */
  Film = "film",
  /** Specific types of audio with one item per feed, or where items represent chapters within the book */
  Audiobook = "audiobook",
  /** A feed of curated written articles. Newsletter articles now sometimes have a spoken version audio enclosure attached */
  Newsletter = "newsletter",
  /** A feed of informally written articles. Similar to newsletter but more informal as in a traditional blog platform style */
  Blog = "blog",
  /** A feed of podcasts from the same publisher */
  Publisher = "publisher",
  /** A feed of educational content organized into a course with episodes representing lessons or modules */
  Course = "course",
  /** A feed containing a mix of different media types combined together */
  Mixed = "mixed",

  // List variants - feeds that aggregate or list other content of a specific medium type
  /** A list feed that aggregates multiple podcast feeds */
  PodcastL = "podcastL",
  /** A list feed that aggregates multiple music feeds */
  MusicL = "musicL",
  /** A list feed that aggregates multiple video feeds */
  VideoL = "videoL",
  /** A list feed that aggregates multiple film feeds */
  FilmL = "filmL",
  /** A list feed that aggregates multiple audiobook feeds */
  AudiobookL = "audiobookL",
  /** A list feed that aggregates multiple newsletter feeds */
  NewsletterL = "newsletterL",
  /** A list feed that aggregates multiple blog feeds */
  BlogL = "blogL",
  /** A list feed that aggregates multiple publisher feeds */
  PublisherL = "publisherL",
  /** A list feed that aggregates multiple course feeds */
  CourseL = "courseL",
}
export const medium: FeedUpdate = {
  tag: "podcast:medium",
  name: "medium",
  phase: 4,
  nodeTransform: (node: XmlNode) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node).find(
      (n) => getText(n) && lookupCaseInsensitive(Phase4Medium, getText(n))
    ),
  supportCheck: (node: XmlNode) => Boolean(node) && Boolean(getText(node)),
  fn(node: XmlNode): { medium: Phase4Medium } {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = lookupCaseInsensitive(Phase4Medium, nodeValue);
      if (parsed) {
        return { medium: parsed };
      }
    }
    throw new Error("Unable to extract medium from feed, `supportCheck` needs to be updated");
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#images
 *
 * This tag, when present, allows for specifying many different image sizes in a compact way at either the
 * episode or channel level. The syntax is borrowed from the HTML5 srcset syntax. It allows for describing
 * multiple image sources with width and pixel hints directly in the attribute.
 */
type Phase4PodcastParsedImage =
  | {
      url: string;
      width: number;
    }
  | {
      url: string;
      density: number;
    }
  | { url: string };

export type Phase4PodcastImage = {
  raw: string;
  parsed: Phase4PodcastParsedImage;
};
export const podcastImages = {
  phase: 4,
  name: "images",
  tag: "podcast:images",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getAttribute(n, "srcset")),
  supportCheck: (node: XmlNode): boolean => Boolean(node),
  fn(node: XmlNode): { podcastImages: Phase4PodcastImage[] } {
    return {
      podcastImages: (getKnownAttribute(node, "srcset")
        .split(",")
        .reduce<Phase4PodcastImage[]>((acc, n) => {
          const raw = n.trim();
          if (raw) {
            const components = raw.split(/\s+/);
            const val: Partial<Phase4PodcastImage> = { raw };
            if (components.length === 2) {
              if (components[1].endsWith("w")) {
                val.parsed = {
                  url: components[0],
                  width: parseInt(components[1].replace(/w$/, ""), 10),
                };
              } else if (components[1].endsWith("x")) {
                val.parsed = {
                  url: components[0],
                  density: parseFloat(components[1].replace(/x$/, "")),
                };
              } else {
                logger.warn(components, "Unexpected descriptor");
                val.parsed = {
                  url: components[0],
                };
              }
            } else {
              val.parsed = { url: raw };
            }
            return [...acc, val as Phase4PodcastImage];
          }
          return acc;
        }, [] as Phase4PodcastImage[]) as unknown) as Phase4PodcastImage[],
    };
  },
};
addSubTag("liveItem", podcastImages);

function getContentLinks(node: XmlNode): Phase4ContentLink[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return ensureArray(node["podcast:contentLink"]).map((cln) => ({
    title: getText(cln),
    url: getAttribute(cln, "href") ?? "",
  }));
}
export enum Phase4LiveStatus {
  Pending = "pending",
  Live = "live",
  Ended = "ended",
}
export type Phase4PodcastLiveItemItem = Pick<Episode, "title" | "guid" | "enclosure"> &
  Partial<
    Pick<
      Episode,
      | "description"
      | "link"
      | "author"
      | "podcastPeople"
      | "alternativeEnclosures"
      | "podcastImages"
      | "value"
    >
  > & {
    // phased in properties assumed to be dynamically added via addSubTag

    // Pending
    chat?: Phase7Chat | { phase: "4"; url: string };
    /** PENDING AND LIKELY TO CHANGE */
    liveUpdates?: PhasePendingLiveUpdates;
  };
type Phase4ContentLink = {
  url: string;
  title: string;
};
export type Phase4PodcastLiveItem = Phase4PodcastLiveItemItem & {
  status: Phase4LiveStatus;
  start: Date;
  end?: Date;
  image?: string;
  contentLinks: Phase4ContentLink[];
};
export const liveItem = {
  phase: 4,
  tag: "podcast:liveItem",
  name: "liveItem",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) =>
      Boolean(
        n &&
          getAttribute(n, "status") &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          lookup(Phase4LiveStatus, getAttribute(n, "status")!.toLowerCase()) &&
          getAttribute(n, "start")
      )
    ),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastLiveItems: Phase4PodcastLiveItem[] } {
    return {
      podcastLiveItems: node
        .map((n) => {
          const guid = ItemParser.getGuid(n);
          const title = ItemParser.getTitle(n);
          const enclosure = ItemParser.getEnclosure(n);
          if (!(guid && title && enclosure)) {
            return {} as EmptyObj;
          }

          const item: Phase4PodcastLiveItemItem = {
            guid,
            enclosure,
            ...title,
            ...ItemParser.getDescription(n),
            ...ItemParser.getLink(n),
            ...ItemParser.getAuthor(n),
            ...ItemParser.getImage(n),
          };

          getSubTags("liveItem").forEach((tag) => {
            useParser(tag, n, item);
          });

          const chatAttribute = getAttribute(n, "chat");
          if (!item.chat && chatAttribute) {
            item.chat = {
              phase: "4",
              url: chatAttribute,
            };
          }

          return {
            status: knownLookup(Phase4LiveStatus, getKnownAttribute(n, "status").toLowerCase()),
            start: pubDateToDate(getKnownAttribute(n, "start")),
            ...(getAttribute(n, "end")
              ? { end: pubDateToDate(getKnownAttribute(n, "end")) }
              : undefined),
            ...(Object.keys(item).length > 0 ? item : undefined),
            contentLinks: getContentLinks(n),
          } as Phase4PodcastLiveItem;
        })
        .filter((x: EmptyObj | Phase4PodcastLiveItem) =>
          Boolean("start" in x)
        ) as Phase4PodcastLiveItem[],
    };
  },
};
