/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { logger } from "../../logger";
import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalStringAttribute,
  firstIfArray,
  getAttribute,
  getBooleanAttribute,
  getKnownAttribute,
  getText,
  lookup,
} from "../shared";
import type { XmlNode } from "../types";

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
const validRecipient = (n: XmlNode): boolean =>
  Boolean(getAttribute(n, "type") && getAttribute(n, "address") && getAttribute(n, "split"));
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
        recipients: ensureArray(node["podcast:valueRecipient"])
          .filter(validRecipient)
          .map((innerNode) => ({
            ...extractOptionalStringAttribute(innerNode, "name"),
            ...extractOptionalStringAttribute(innerNode, "customKey"),
            ...extractOptionalStringAttribute(innerNode, "customValue"),
            type: getKnownAttribute(innerNode, "type"),
            address: getKnownAttribute(innerNode, "address"),
            split: parseInt(getKnownAttribute(innerNode, "split"), 10),
            fee: getBooleanAttribute(innerNode, "fee"),
          })),
      },
    };
  },
};

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
