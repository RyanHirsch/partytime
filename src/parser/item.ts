/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { log } from "../logger";
import {
  Enclosure,
  ensureArray,
  Episode,
  FeedObject,
  firstWithAttributes,
  firstWithValue,
  getAttribute,
  getKnownAttribute,
  getNumber,
  getText,
  guessEnclosureType,
  ItunesEpisodeType,
  lookup,
  pubDateToDate,
  sanitizeMultipleSpaces,
  sanitizeNewLines,
  sanitizeUrl,
  timeToSeconds,
} from "./shared";

export function isValidItem(item: XmlNode): boolean {
  // If there is no enclosure, just skip this item and move on to the next
  if (!getEnclosure(item)) {
    log.warn("Item has no enclosure, skipping it.");
    return false;
  }

  // If there is no guid in the item, then skip this item and move on
  if (!getGuid(item)) {
    log.warn("Item has no guid, skipping it.");
    return false;
  }

  // If there is no title or description
  if (!getTitle(item) && !getDescription(item)) {
    log.warn("Item has no title or description, skipping it.");
    return false;
  }

  return true;
}

/** If an item guid is empty, its considered invalid and will be skipped */
function getGuid(item: XmlNode): string {
  const node = firstWithValue(item.guid);
  return getText(node);
}

function getEnclosure(item: XmlNode): Enclosure | null {
  const node = firstWithAttributes(item.enclosure, ["url"]);
  if (node) {
    return {
      url: getKnownAttribute(node, "url"),
      length: parseInt(getAttribute(node, "length") ?? "0", 10),
      type: getAttribute(node, "type") ?? guessEnclosureType(getKnownAttribute(node, "url")),
    };
  }
  return null;
}

function getAuthor(item: XmlNode): string {
  const node = firstWithValue(item.author);
  const fallbackNode = firstWithValue(item["itunes:author"]);
  return getText(node) || getText(fallbackNode);
}

function getTitle(item: XmlNode): string {
  const node = firstWithValue(item.title);
  const fallbackNode = firstWithValue(item["itunes:title"]);
  return sanitizeMultipleSpaces(sanitizeNewLines(getText(node) || getText(fallbackNode)));
}

function getDescription(item: XmlNode): string {
  const node = firstWithValue(item.description);
  return sanitizeMultipleSpaces(sanitizeNewLines(getText(node)));
}

function getLink(item: XmlNode): string {
  const node = firstWithValue(item.link) || firstWithAttributes(item.link, ["href"]);
  return getText(node) || getAttribute(node, "href") || "";
}

function getItunesImage(item: XmlNode): string {
  const node = item["itunes:image"];
  if (!node) {
    return "";
  }

  return sanitizeUrl(getText(node) || getAttribute(node, "href") || getText(node.url));
}

function getImage(item: XmlNode): string {
  const node = item.image;
  return sanitizeUrl(getText(node?.url) || getItunesImage(item));
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

export function handleItem(item: XmlNode, _feed: Partial<FeedObject>): Episode {
  return {
    guid: getGuid(item),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    enclosure: getEnclosure(item)!,
    author: getAuthor(item),
    title: getTitle(item),
    link: getLink(item),
    itunesImage: getItunesImage(item),
    duration: getDuration(item),
    explicit: getExplicit(item),
    ...getItunesEpisode(item),
    ...getItunesEpisodeType(item),
    ...getItunesSeason(item),
    ...getKeywords(item),
    ...getPubDate(item),
    description: getDescription(item),
    image: getImage(item),
  };
}
