/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { logger } from "../logger";

import {
  ensureArray,
  firstWithAttributes,
  firstWithValue,
  getAttribute,
  getKnownAttribute,
  getNumber,
  getText,
  guessEnclosureType,
  lookup,
  pubDateToDate,
  sanitizeMultipleSpaces,
  sanitizeNewLines,
  sanitizeUrl,
  timeToSeconds,
} from "./shared";
import type { BasicFeed, Enclosure, Episode, XmlNode } from "./types";
import { unescape } from "./unescape";

export enum ItunesEpisodeType {
  Full = "full",
  Trailer = "trailer",
  Bonus = "bonus",
}

export function isValidItem(
  item: XmlNode,
  { allowMissingGuid = false }: { allowMissingGuid?: boolean } = {}
): boolean {
  // If there is no enclosure, just skip this item and move on to the next
  if (!getEnclosure(item)) {
    logger.warn("Item has no enclosure, skipping it.");
    return false;
  }

  // If there is no guid in the item, then skip this item and move on
  if (!getGuid(item) && !allowMissingGuid) {
    logger.warn("Item has no guid, skipping it.");
    return false;
  }
  if (!getGuid(item) && allowMissingGuid) {
    logger.warn("Item has no guid, but flag passed to allow it.");
  }

  // If there is no title or description
  if (!getTitle(item) && !getDescription(item)) {
    logger.warn("Item has no title or description, skipping it.");
    return false;
  }

  return true;
}

/** If an item guid is empty, its considered invalid and will be skipped */
export function getGuid(item: XmlNode): string {
  // The guid node also has a isPermaLink attribute which is being ignored
  // https://validator.w3.org/feed/docs/error/InvalidPermalink.html
  const node = firstWithValue(item.guid);
  const textValue = getText(node);
  if (textValue) {
    return textValue;
  }

  const numberValue = getNumber(node);
  if (typeof numberValue === "number") {
    return numberValue.toString();
  }

  console.warn("Empty/missing guid, returning empty string");
  return "";
}

export function getEnclosure(item: XmlNode): Enclosure | null {
  const node = firstWithAttributes(item.enclosure, ["url"]);
  if (node) {
    return {
      url: unescape(getKnownAttribute(node, "url")),
      length: parseInt(getAttribute(node, "length") ?? "0", 10),
      type: getAttribute(node, "type") ?? guessEnclosureType(getKnownAttribute(node, "url")),
    };
  }
  return null;
}

export function getAuthor(item: XmlNode): undefined | { author: string } {
  const node = firstWithValue(item.author);
  const fallbackNode = firstWithValue(item["itunes:author"]);
  const author = getText(node) || getText(fallbackNode);
  if (author) {
    return { author };
  }
  return undefined;
}

export function getTitle(item: XmlNode): undefined | { title: string } {
  const node = firstWithValue(item.title);
  const fallbackNode = firstWithValue(item["itunes:title"]);
  const title = sanitizeMultipleSpaces(sanitizeNewLines(getText(node) || getText(fallbackNode)));
  if (title) {
    return { title };
  }
  return undefined;
}

export function getItunesTitle(item: XmlNode): undefined | { itunesTitle: string } {
  const node = firstWithValue(item["itunes:title"]);
  const itunesTitle = sanitizeMultipleSpaces(sanitizeNewLines(getText(node)));
  if (itunesTitle) {
    return { itunesTitle };
  }
  return undefined;
}

export function getDescription(item: XmlNode): undefined | { description: string } {
  const node = firstWithValue(item.description);

  if (node) {
    const descriptionValue = sanitizeMultipleSpaces(sanitizeNewLines(getText(node)));
    if (descriptionValue) {
      return { description: descriptionValue };
    }
  }

  const contentValue = getContent(item);
  if (contentValue?.content) {
    return { description: contentValue.content };
  }

  const summary = getSummary(item);
  if (summary) {
    return { description: summary.summary };
  }

  return undefined;
}

export function getContent(item: XmlNode): undefined | { content: string } {
  const contentNode = firstWithValue(item["content:encoded"]);
  if (contentNode) {
    const contentValue = getText(contentNode);
    if (contentValue) {
      return { content: contentValue };
    }
  }

  return undefined;
}

export function getLink(item: XmlNode): undefined | { link: string } {
  const node = firstWithValue(item.link) || firstWithAttributes(item.link, ["href"]);
  const value = getText(node) || getAttribute(node, "href") || "";

  if (value) {
    return { link: value };
  }
  return undefined;
}

function getItunesImage(item: XmlNode): undefined | { itunesImage: string } {
  const image = ensureArray(item["itunes:image"]).find(
    (n) => getText(n) || getAttribute(n, "href") || getText(n?.url)
  );
  if (!image) {
    return undefined;
  }

  return {
    itunesImage: sanitizeUrl(getText(image) || getAttribute(image, "href") || getText(image.url)),
  };
}

export function getImage(item: XmlNode): undefined | { image: string } {
  const node = ensureArray(item.image).find((n) => getText(n?.url));
  const image = sanitizeUrl(getText(node?.url));
  if (image) {
    return { image };
  }
  const itunesImage = getItunesImage(item);
  if (itunesImage) {
    return { image: itunesImage.itunesImage };
  }
  return undefined;
}

function getExplicit(item: XmlNode): boolean {
  const node = firstWithValue(item["itunes:explicit"]);
  const nodeText = getText(node).toLowerCase();

  if (["yes", "true"].includes(nodeText)) {
    return true;
  }
  if (typeof node === "boolean" && node) {
    return true;
  }
  return false;
}

function getDuration(item: XmlNode): number {
  const node = firstWithValue(item["itunes:duration"]);
  const durationValue = (getText(node) || getNumber(node)) ?? 0;

  if (typeof durationValue === "string") {
    const seconds = timeToSeconds(durationValue);
    return Number.isNaN(seconds) ? 0 : seconds;
  }
  return durationValue;
}

function getItunesEpisode(item: XmlNode): undefined | { itunesEpisode: number } {
  const node = firstWithValue(item["itunes:episode"]);
  const episodeValue = getText(node) || getNumber(node);
  if (typeof episodeValue === "string") {
    const parsedString = episodeValue.replace(/\D/g, "");
    if (parsedString) {
      return { itunesEpisode: parseInt(parsedString, 10) };
    }
  } else if (typeof episodeValue === "number") {
    return { itunesEpisode: episodeValue };
  }
  return undefined;
}

function getItunesSeason(item: XmlNode): undefined | { itunesSeason: number } {
  const node = firstWithValue(item["itunes:season"]);
  const value = getText(node) || getNumber(node);
  if (typeof value === "string") {
    const parsedString = value.replace(/\D/g, "");
    if (parsedString) {
      return { itunesSeason: parseInt(parsedString, 10) };
    }
  } else if (typeof value === "number") {
    return { itunesSeason: value };
  }
  return undefined;
}

function getItunesEpisodeType(item: XmlNode): undefined | { itunesEpisodeType: ItunesEpisodeType } {
  const node = firstWithValue(item["itunes:episodeType"]);
  const typeValue = getText(node).toLowerCase();
  const episodeType = lookup(ItunesEpisodeType, typeValue);

  if (episodeType) {
    return { itunesEpisodeType: episodeType };
  }

  return undefined;
}

function getKeywords(item: XmlNode): undefined | { keywords: string[] } {
  const node = firstWithValue(item["itunes:keywords"]);
  const keywords = getText(node);
  if (keywords) {
    const parsed = keywords
      .split(",")
      .map((k) => k.trim())
      .map(sanitizeMultipleSpaces)
      .filter(Boolean);
    if (parsed.length) {
      return { keywords: parsed };
    }
  }
  return undefined;
}

function getPubDate(item: XmlNode): undefined | { pubDate: Date } {
  const node = firstWithValue(item.pubDate);
  const value = getText(node) || getNumber(node);

  if (value) {
    const parsed = pubDateToDate(value);
    if (parsed) {
      return { pubDate: parsed };
    }
  }
  return undefined;
}

function getSummary(item: XmlNode): undefined | { summary: string } {
  const node = firstWithValue(item["itunes:summary"]);
  if (node) {
    const summaryValue = getText(node);
    if (summaryValue) {
      return { summary: summaryValue };
    }
  }

  return undefined;
}

function getSubtitle(item: XmlNode): undefined | { subtitle: string } {
  const node = firstWithValue(item["itunes:subtitle"]);
  if (node) {
    const value = sanitizeNewLines(sanitizeMultipleSpaces(getText(node)));
    if (value) {
      return { subtitle: value };
    }
  }

  return undefined;
}

export function handleItem(item: XmlNode, _feed: BasicFeed): Episode {
  return {
    guid: getGuid(item),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    enclosure: getEnclosure(item)!,
    duration: getDuration(item),
    explicit: getExplicit(item),
    ...getTitle(item),
    ...getItunesTitle(item),
    ...getAuthor(item),
    ...getLink(item),
    ...getItunesImage(item),
    ...getItunesEpisode(item),
    ...getItunesEpisodeType(item),
    ...getItunesSeason(item),
    ...getKeywords(item),
    ...getPubDate(item),
    ...getImage(item),
    ...getSummary(item),
    ...getDescription(item),
    ...getSubtitle(item),
    ...getContent(item),
  };
}
