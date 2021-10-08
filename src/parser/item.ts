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
  if (typeof item.enclosure !== "object") {
    log.warn("Item has no enclosure, skipping it.");
    return false;
  }

  // If there is no guid in the item, then skip this item and move on
  if (!getGuid(item)) {
    log.warn("Item has no guid, skipping it.");
    return false;
  }

  return true;
}

/** If an item guid is empty, its considered invalid and will be skipped */
function getGuid(item: XmlNode): string {
  return getText(item.guid);
}

function getEnclosure(item: XmlNode): Enclosure {
  const enclosure = ensureArray(item.enclosure).find((i) => getAttribute(i, "url"));
  return {
    url: getKnownAttribute(enclosure, "url"),
    length: parseInt(getAttribute(enclosure, "length") ?? "0", 10),
    type:
      getAttribute(enclosure, "type") ?? guessEnclosureType(getKnownAttribute(enclosure, "url")),
  };
}

function getAuthor(item: XmlNode): string {
  return getText(item.author) || getText(item["itunes:author"]);
}

function getTitle(item: XmlNode): string {
  return sanitizeMultipleSpaces(
    sanitizeNewLines(getText(item.title) || getText(item["itunes:title"]))
  );
}

function getLink(item: XmlNode): string {
  return getText(item.link) || getAttribute(item.link, "href") || "";
}

function getItunesImage(item: XmlNode): string {
  const imageNode = item["itunes:image"];
  if (!imageNode) {
    return "";
  }

  return sanitizeUrl(
    getText(imageNode) || getAttribute(imageNode, "href") || getText(imageNode.url)
  );
}

function getImage(item: XmlNode): string {
  return sanitizeUrl(getText(item.image?.url) || getItunesImage(item));
}

function getExplicit(item: XmlNode): boolean {
  const explicitNode = item["itunes:explicit"];
  const explicitNodeText = getText(explicitNode).toLowerCase();

  if (["yes", "true"].includes(explicitNodeText)) {
    return true;
  }
  if (typeof explicitNode === "boolean" && explicitNode) {
    return true;
  }
  return false;
}

function getDuration(item: XmlNode): number {
  const durationValue =
    (getText(item["itunes:duration"]) || getNumber(item["itunes:duration"])) ?? 0;

  if (typeof durationValue === "string") {
    const seconds = timeToSeconds(durationValue);
    return Number.isNaN(seconds) ? 0 : seconds;
  }
  return durationValue;
}

function getItunesEpisode(item: XmlNode): undefined | { itunesEpisode: number } {
  const episodeValue = getText(item["itunes:episode"]) || getNumber(item["itunes:episode"]);
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
  const value = getText(item["itunes:season"]) || getNumber(item["itunes:season"]);
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
  const typeValue = getText(item["itunes:episodeType"]).toLowerCase();
  const episodeType = lookup(ItunesEpisodeType, typeValue);

  if (episodeType) {
    return { itunesEpisodeType: episodeType };
  }

  return undefined;
}

function getKeywords(item: XmlNode): undefined | { keywords: string[] } {
  const keywords = getText(item["itunes:keywords"]);
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

export function handleItem(item: XmlNode, _feed: Partial<FeedObject>): Episode {
  return {
    author: getAuthor(item),
    title: getTitle(item),
    link: getLink(item),
    itunesImage: getItunesImage(item),
    duration: getDuration(item),
    explicit: getExplicit(item),
    enclosure: getEnclosure(item),
    ...getItunesEpisode(item),
    ...getItunesEpisodeType(item),
    ...getItunesSeason(item),
    ...getKeywords(item),
    pubDate: pubDateToDate(item.pubDate),
    guid: getGuid(item),
    description: "",
    image: getImage(item),
  };
}
