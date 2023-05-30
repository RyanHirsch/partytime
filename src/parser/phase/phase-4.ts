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
  pubDateToDate,
} from "../shared";
import type { EmptyObj, Episode, RSSFeed, XmlNode } from "../types";
import * as ItemParser from "../item";

import { XmlNodeSource } from "./types";
import { person } from "./phase-2";
import { liveItemAlternativeEnclosure } from "./phase-3";
import { addSubTag, getSubTags } from "./helpers";
import type { PhasePendingChat } from "./phase-pending";
import { extractRecipients, validRecipient } from "./value-helpers";

import type { FeedUpdate, ItemUpdate } from "./index";

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const defaultNodeTransform = (x: XmlNode): XmlNode => x;
const defaultSupportCheck = (x: XmlNode): boolean => typeof x === "object";

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
    return {
      value: {
        type: getKnownAttribute(node, "type"),
        method: getKnownAttribute(node, "method"),
        ...extractOptionalFloatAttribute(node, "suggested"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        recipients: extractRecipients(ensureArray(node["podcast:valueRecipient"])),
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
  /** a feed of curated written articles. Newsletter articles now sometimes have an spoken version audio enclosure attached */
  Newsletter = "newsletter",
  /** a feed of informally written articles. Similar to newsletter but more informal as in a traditional blog platform style */
  Blog = "blog",
}
export const medium: FeedUpdate = {
  tag: "podcast:medium",
  name: "medium",
  phase: 4,
  nodeTransform: (node: XmlNode) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node).find(
      (n) => getText(n) && lookup(Phase4Medium, getText(n).toLowerCase())
    ),
  supportCheck: (node: XmlNode) => Boolean(node) && Boolean(getText(node)),
  fn(node: XmlNode): { medium: Phase4Medium } {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = lookup(Phase4Medium, nodeValue.toLowerCase());
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
    chat?: PhasePendingChat;
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
    const useParser = (
      itemUpdate: ItemUpdate,
      n: XmlNode,
      item: Phase4PodcastLiveItemItem
    ): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const nodeContents = n[itemUpdate.tag];
      if (nodeContents) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const transformedNode = (itemUpdate.nodeTransform ?? defaultNodeTransform)(nodeContents);
        if (
          transformedNode &&
          (itemUpdate.supportCheck ?? defaultSupportCheck)(transformedNode, XmlNodeSource.Item)
        ) {
          Object.assign(item, itemUpdate.fn(transformedNode, {} as RSSFeed, XmlNodeSource.Item));
        }
      }
    };

    return {
      podcastLiveItems: node
        .map((n) => {
          const guid = ItemParser.getGuid(n);
          const title = ItemParser.getTitle(n);
          const enclosure = ItemParser.getEnclosure(n);
          if (!(guid && title && enclosure)) {
            return {} as EmptyObj;
          }

          // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          // const transformed = value.nodeTransform(n[value.tag]);
          // const v =
          //   transformed && value.supportCheck(transformed) ? value.fn(transformed) : undefined;

          const item: Phase4PodcastLiveItemItem = {
            guid,
            enclosure,
            ...title,
            ...ItemParser.getDescription(n),
            ...ItemParser.getLink(n),
            ...ItemParser.getAuthor(n),
            ...ItemParser.getImage(n),
            // ...v,
          };

          useParser(person, n, item);
          useParser(liveItemAlternativeEnclosure, n, item);
          useParser(podcastImages, n, item);

          getSubTags("liveItem").forEach((tag) => {
            useParser(tag, n, item);
          });

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
