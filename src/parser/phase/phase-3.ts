/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as mime from "mime-types";

import {
  ensureArray,
  extractOptionalIntegerAttribute,
  extractOptionalStringAttribute,
  firstIfArray,
  getAttribute,
  getKnownAttribute,
  getText,
} from "../shared";

import { json as licenseDefinitions } from "./licenses";

import type { FeedUpdate, ItemUpdate } from "./index";
import { log } from "../../logger";
import type { EmptyObj, XmlNode } from "../types";

// <podcast:guid>

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#trailer
 *
 * This element is used to define the location of an audio or video file to be used as a trailer for
 * the entire podcast or a specific season. There can be more than one trailer present in the channel
 * of the feed. This element is basically just like an <enclosure> with the extra pubdate and season
 * attributes added.
 *
 * If there is more than one trailer tag present in the channel, the most recent one (according to its
 * pubdate) should be chosen as the preview by default within podcast apps.
 *
 */
export type Phase3Trailer = {
  url: string;
  pubdate: Date;
  /** Recommended but not required, the length in bytes */
  length?: number;
  /** Recommended but not required, the mime type of the file */
  type?: string;
  /** Optionally specify that this trailer is for a particular season number */
  season?: number;
};
export const trailer: FeedUpdate = {
  phase: 3,
  tag: "trailer",
  supportCheck: (node) => {
    const fNode = firstIfArray(node);
    return (
      Boolean(getText(fNode)) &&
      Boolean(getAttribute(fNode, "url")) &&
      Boolean(getAttribute(fNode, "pubdate"))
    );
  },
  fn(node: XmlNode) {
    return {
      trailers: ensureArray(node).map<Phase3Trailer>((trailerNode) => ({
        title: getText(trailerNode),
        url: getKnownAttribute(trailerNode, "url"),
        pubdate: new Date(getKnownAttribute(trailerNode, "pubdate")),
        ...extractOptionalStringAttribute(trailerNode, "type"),
        ...extractOptionalIntegerAttribute(trailerNode, "length"),
        ...extractOptionalIntegerAttribute(trailerNode, "season"),
      })),
    };
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#license
 *
 * This element defines a license that is applied to the audio/video content of a single episode, or
 * the audio/video of the podcast as a whole. Custom licenses must always include a url attribute.
 * Implementors are encouraged to read the license tag companion document for a more complete picture
 * of what this tag is intended to accomplish.
 */
export type Phase3License = {
  url: string;
  identifier: string;
};
export const license = {
  phase: 3,
  tag: "license",
  nodeTransform: firstIfArray,
  supportCheck: (node: XmlNode): boolean => {
    const identifier = getText(node);
    const url =
      getAttribute(node, "url") ??
      licenseDefinitions.licenses.find(
        (l) => l.licenseId.toLowerCase() === identifier.toLowerCase()
      )?.reference;

    return Boolean(identifier) && Boolean(url);
  },
  fn(node: XmlNode, feed: XmlNode): EmptyObj | { license: Phase3License } {
    log.info("license found");

    const identifier = getText(node);
    const url =
      getAttribute(node, "url") ??
      licenseDefinitions.licenses.find(
        (l) => l.licenseId.toLowerCase() === identifier.toLowerCase()
      )?.reference;

    if (!url) {
      log.warn(
        `Missing License URL for ${identifier}, originating in ${feed.rss.channel.title as string}`
      );
      return {};
    }

    log.info(`  [${identifier}](${url})`);
    return {
      license: {
        identifier,
        url,
      },
    };
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#alternate-enclosure
 *
 * This element is meant to provide different versions of, or companion media to the main <enclosure>
 * file. This could be an audio only version of a video podcast to allow apps to switch back and forth
 * between audio/video, lower (or higher) bitrate versions for bandwidth constrained areas, alternative
 * codecs for different device platforms, alternate URI schemes and download types such as IPFS or
 * WebTorrent, commentary tracks or supporting source clips, etc. This is a complex tag, so implementors
 * are highly encouraged to read the companion document for a fuller understanding of how this tag works
 * and what it is capable of.
 */
export type Phase3AltEnclosure = {
  source: Array<{
    /** the uri where the media file resides */
    uri: string;
    /** This is a string that declares the mime-type of the file. It is useful if the transport mechanism is different than the file being delivered, as is the case with a torrents. */
    contentType: string;
  }>;
  /** Mime Type of the asset */
  type: string;
  /** Length in bytes */
  length: number;
  /** Boolean specifying whether or not the given media is the same as the file from the enclosure element and should be the preferred media element. The primary reason to set this is to offer alternative transports for the enclosure. If not set, this should be assumed to be false. */
  default: boolean;
  /** Encoding bitrate of media asset. */
  bitrate?: number;
  /** Height of the media asset for video formats. */
  height?: number;
  /** An IETF language tag (BCP 47) code identifying the language of this media. */
  lang?: string;
  /** A human-readable string identifying the name of the media asset. Should be limited to 32 characters for UX. */
  title?: string;
  /** Provides a method of offering and/or grouping together different media elements. If not set, or set to "default", the media will be grouped with the enclosure and assumed to be an alternative to the enclosure's encoding/transport. This attribute can and should be the same for items with the same content encoded by different means. Should be limited to 32 characters for UX. */
  rel?: string;
  /** An RFC 6381 string specifying the codecs available in this media. */
  codecs?: string;
  /** Optional Integrity check value */
  integrity?: {
    type: IntegrityType;
    value: string;
  };
};
enum IntegrityType {
  SRI = "sri",
  PGP = "pgp-signature",
}
export const alternativeEnclosure: ItemUpdate = {
  phase: 3,
  tag: "alternateEnclosure",
  nodeTransform: ensureArray,
  supportCheck: (node) => {
    return (node as XmlNode[]).some((i) => {
      const type = getAttribute(i, "type");
      const length = getAttribute(i, "length");
      const sourceNodes = ensureArray(i?.["podcast:source"] ?? []);

      return (
        Boolean(type) &&
        Boolean(length) &&
        sourceNodes.length > 0 &&
        sourceNodes.some((n) => getAttribute(n, "uri"))
      );
    });
  },
  fn(node, _feed) {
    log.info("alternateEnclosure");

    const update: Phase3AltEnclosure[] = [];

    (node as XmlNode[]).forEach((altEncNode) => {
      const type = getKnownAttribute(altEncNode, "type");
      const length = getKnownAttribute(altEncNode, "length");
      const sourceUris = ensureArray(altEncNode["podcast:source"] ?? [])
        .map((sourceNode) => ({
          uri: getAttribute(sourceNode, "uri"),
          contentType: getAttribute(sourceNode, "contentType"),
        }))
        .filter(
          (x): x is { uri: string; contentType: string | null } =>
            x.uri !== null && Boolean(x.uri.trim())
        )
        .map((x) => ({ ...x, contentType: mime.lookup(x.uri) || type }));

      const integrityNode = altEncNode["podcast:integrity"];
      const integrity =
        integrityNode && getAttribute(integrityNode, "type") && getAttribute(integrityNode, "value")
          ? {
              type:
                getKnownAttribute(integrityNode, "type") === "pgp-signature"
                  ? IntegrityType.PGP
                  : IntegrityType.SRI,
              value: getKnownAttribute(integrityNode, "value"),
            }
          : null;

      if (type && length && sourceUris.length > 0) {
        update.push({
          type,
          length: parseInt(length, 10),
          source: sourceUris,
          default: /^true$/i.test(getAttribute(altEncNode, "default") ?? ""),
          ...(integrity ? { integrity } : undefined),
          ...extractOptionalIntegerAttribute(altEncNode, "bitrate"),
          ...extractOptionalIntegerAttribute(altEncNode, "height"),
          ...extractOptionalStringAttribute(altEncNode, "lang"),
          ...extractOptionalStringAttribute(altEncNode, "title"),
          ...extractOptionalStringAttribute(altEncNode, "rel"),
          ...extractOptionalStringAttribute(altEncNode, "codecs"),
        });
      }
    });

    return { alternativeEnclosures: update };
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#integrity
 *
 * This element is used to declare a unique, global identifier for a podcast. The value is a UUIDv5, and
 * is easily generated from the RSS feed url, with the protocol scheme and trailing slashes stripped off,
 * combined with a unique "podcast" namespace which has a UUID of ead4c236-bf58-58c6-a2c6-a6b28d128cb6.
 *
 * A podcast gets assigned a podcast:guid once in its lifetime using its current feed url (at the time of
 * assignment) as the seed value. That GUID is then meant to follow the podcast from then on, for the
 * duration of its life, even if the feed url changes. This means that when a podcast moves from one hosting
 * platform to another, its podcast:guid should be discovered by the new host and imported into the new
 * platform for inclusion into the feed.
 */
export const guid: FeedUpdate = {
  phase: 3,
  tag: "guid",
  supportCheck: (node) => Boolean(getText(node)),
  fn(node, _feed) {
    log.info("guid");

    return {
      guid: getText(node),
    };
  },
};
