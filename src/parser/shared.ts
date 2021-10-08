/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

// import iconv from "iconv-lite";

import type {
  Phase1Transcript,
  Phase1Funding,
  Phase1Chapter,
  Phase1SoundBite,
} from "./phase/phase-1";
import type {
  Phase2Person,
  Phase2Location,
  Phase2SeasonNumber,
  Phase2EpisodeNumber,
} from "./phase/phase-2";
import type { Phase3Trailer, Phase3License, Phase3AltEnclosure } from "./phase/phase-3";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TODO = any;

export interface RSSFeed {
  rss: {
    channel: any;
  };
}

export enum FeedType {
  RSS = 0,
  ATOM = 1,
  BadFormat = 9,
}

export enum ItunesFeedType {
  /**
   * Default Specify episodic when episodes are intended to be consumed without any specific order. Apple
   * Podcasts will present newest episodes first and display the publish date (required) of each episode. If
   * organized into seasons, the newest season will be presented first - otherwise, episodes will be grouped
   * by year published, newest first.
   */
  Episodic = "episodic",
  /** Specify serial when episodes are intended to be consumed in sequential order. Apple Podcasts will
   * present the oldest episodes first and display the episode numbers (required) of each episode. If
   * organized into seasons, the newest season will be presented first and <itunes:episode> numbers must be
   * given for each episode.
   *
   * For new subscribers, Apple Podcasts adds the first episode to their Library, or the entire current season
   * if using seasons.
   */
  Serial = "serial",
}

export enum ItunesEpisodeType {
  Full = "full",
  Trailer = "trailer",
  Bonus = "bonus",
}

export interface FeedObject {
  type: FeedType;
  title: string;
  link: string;
  language: string;
  generator: string;
  /** Seconds from epoch */
  pubDate: Date;
  /** seconds from epoch */
  lastBuildDate: Date;
  lastUpdate: Date;

  itunesType: ItunesFeedType;
  itunesCategory: TODO[];
  itunesNewFeedUrl: TODO;
  categories: string[];

  value: TODO;

  pubsub: false | { hub: string; self: string };
  itunesAuthor: string;
  itunesOwnerEmail: string;
  itunesOwnerName: string;
  itunesImage: string;
  image: string;

  explicit: boolean;

  description: string;

  locked: boolean;
  podcastOwner: string;

  podcastFunding?: Phase1Funding;
  podcastPeople?: Phase2Person[];

  /** What is this podcast about */
  podcastLocation?: Phase2Location;

  trailers?: Phase3Trailer[];
  license?: Phase3License;
  guid?: string;

  /** podcasting 2.0 phase compliance */
  __phase: Record<number, string[]>;

  items: Episode[];
  newestItemPubDate: Date;
  oldestItemPubDate: Date;
}

export type Enclosure = {
  url: string;
  length: number;
  type: string;
};
export interface Episode {
  author: string;
  title: string;
  link: string;
  duration: number;
  itunesEpisode?: number;
  itunesEpisodeType?: ItunesEpisodeType;
  explicit: boolean;
  itunesImage: string;
  itunesSeason: number;
  enclosure: Enclosure;
  /** Seconds from epoch */
  pubDate: Date;
  guid: string;
  description: string;
  image: string;
  podcastChapters?: Phase1Chapter;
  podcastSoundbites?: Phase1SoundBite[];
  podcastTranscripts?: Phase1Transcript[];
  podcastLocation?: Phase2Location;
  podcastPeople?: Phase2Person[];
  podcastSeason?: Phase2SeasonNumber;
  podcastEpisode?: Phase2EpisodeNumber;

  license?: Phase3License;
  alternativeEnclosures?: Phase3AltEnclosure[];
}

export interface PhaseUpdate {
  [p: number]: { [k: string]: boolean };
}

// Parse out all of the links from an atom entry and see which ones are WebSub links
export function findPubSubLinks(channel: any) {
  const pubsublinks = {
    hub: "",
    self: "",
  };

  // Multiple link objects in an array?
  if (Array.isArray(channel.link)) {
    channel.link.forEach(function (item: any) {
      // console.log(item);
      if (typeof item.attr !== "object") return;

      if (typeof item.attr["@_rel"] === "string") {
        if (item.attr["@_rel"] === "hub") {
          // console.log(item);

          // Set the url
          if (typeof item.attr["@_href"] !== "string") return;
          if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

          pubsublinks.hub = item.attr["@_href"];
        }

        if (item.attr["@_rel"] === "self") {
          // console.log(item);

          // Set the url
          if (typeof item.attr["@_href"] !== "string") return;
          if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

          pubsublinks.self = item.attr["@_href"];
        }
      }
    });
  }

  // Multiple link objects in an array?
  if (Array.isArray(channel["atom:link"])) {
    channel["atom:link"].forEach(function (item) {
      if (typeof item.attr !== "object") return;

      if (typeof item.attr["@_rel"] === "string") {
        if (item.attr["@_rel"] === "hub") {
          // Set the url
          if (typeof item.attr["@_href"] !== "string") return;
          if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

          pubsublinks.hub = item.attr["@_href"];
        }

        if (item.attr["@_rel"] === "self") {
          // console.log(item);

          // Set the url
          if (typeof item.attr["@_href"] !== "string") return;
          if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

          pubsublinks.self = item.attr["@_href"];
        }
      }
    });
  }

  if (pubsublinks.hub === "" || pubsublinks.self === "") {
    return false;
  }

  return pubsublinks;
}

// Make the url safe for storing
export function sanitizeUrl(url?: string) {
  let newUrl = "";

  if (typeof url !== "string") return "";

  if (containsNonLatinCodepoints(url)) {
    newUrl = encodeURI(url).substring(0, 768);
    if (typeof newUrl !== "string") return "";

    if (containsNonLatinCodepoints(newUrl)) {
      // eslint-disable-next-line no-control-regex
      newUrl = newUrl.replace(/[^\x00-\x80]/gi, " ");
    }

    return newUrl.substring(0, 768);
  }

  newUrl = url.substring(0, 768);
  if (typeof newUrl !== "string") return "";
  return newUrl;
}

// Test for non-latin
function containsNonLatinCodepoints(s: string) {
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x80]/.test(s)) return true;
  // eslint-disable-next-line no-control-regex
  return /[^\u0000-\u00ff]/.test(s);
}

// RFC date convert to unix epoch
export function pubDateToTimestamp(pubDate: number | string | Date) {
  if (typeof pubDate === "number") {
    return pubDate;
  }

  const date = new Date(pubDate);
  const pubDateParsed = Math.round(date.getTime() / 1000);

  if (Number.isNaN(pubDateParsed)) {
    return 0;
  }

  return pubDateParsed;
}

export function pubDateToDate(pubDate: number | string | Date) {
  if (typeof pubDate === "number") {
    return new Date(pubDate * 1000);
  }

  return new Date(pubDate);
}

// Get a mime-type string for an unknown media enclosure
export function guessEnclosureType(url = ""): string {
  if (url.includes(".m4v")) {
    return "video/mp4";
  }
  if (url.includes(".mp4")) {
    return "video/mp4";
  }
  if (url.includes(".avi")) {
    return "video/avi";
  }
  if (url.includes(".mov")) {
    return "video/quicktime";
  }
  if (url.includes(".mp3")) {
    return "audio/mpeg";
  }
  if (url.includes(".m4a")) {
    return "audio/mp4";
  }
  if (url.includes(".wav")) {
    return "audio/wav";
  }
  if (url.includes(".ogg")) {
    return "audio/ogg";
  }
  if (url.includes(".wmv")) {
    return "video/x-ms-wmv";
  }

  return "";
}

export function timeToSeconds(timeString: string) {
  let seconds = 0;
  const a = timeString.split(":");

  switch (a.length - 1) {
    case 1:
      seconds = +a[0] * 60 + +a[1];
      break;

    case 2:
      seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
      break;

    default:
      if (timeString !== "") seconds = parseInt(timeString, 10);
  }

  // Sometime we get an unparseable value which results in a Nan, in this case return
  // a default of 30 minutes
  if (Number.isNaN(seconds)) {
    seconds = 30 * 60;
  }

  return seconds;
}

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export function firstIfArray<T>(maybeArr: T | T[]): T {
  return Array.isArray(maybeArr) ? maybeArr[0] : maybeArr;
}

export function ensureArray<T>(maybeArr: T | T[]): T[] {
  if (typeof maybeArr === "undefined") {
    return [];
  }
  return Array.isArray(maybeArr) ? maybeArr : [maybeArr];
}

/** Gets the value of the XML node as text */
export function getText(
  node: { "#text": string } | string,
  { sanitize = false }: { sanitize?: boolean } = {}
): string {
  let text = "";
  if (typeof node === "string") {
    text = node.trim();
  } else if (typeof node !== "undefined" && typeof node["#text"] === "string") {
    text = node["#text"].trim();
  }
  if (text && sanitize) {
    text = sanitizeText(text);
  }
  return text;
}

export function sanitizeNewLines(text: string): string {
  return text.replace(/(\r\n|\n|\r)/gm, "");
}

export function sanitizeMultipleSpaces(text: string): string {
  return text.replace(/\s{2,}/g, " ");
}

export function sanitizeText(text: string): string {
  const HIGHEST_POSSIBLE_CHAR_VALUE = 127;
  const GENERIC_REPLACEMENT_CHAR = " ";
  const goodChars = [];

  // Swap out known offenders. Add others as needed.
  // https://unicode-table.com/en/#basic-latin
  const strippedText = text
    .replace(/[\u2014]/g, "--") // emdash
    .replace(/[\u2022]/g, "*") // bullet
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"'); // smart double quotes

  // Strip out any other offending characters.
  for (let i = 0; i < strippedText.length; i++) {
    if (strippedText.charCodeAt(i) <= HIGHEST_POSSIBLE_CHAR_VALUE) {
      goodChars.push(strippedText.charAt(i));
    } else {
      goodChars.push(GENERIC_REPLACEMENT_CHAR);
    }
  }

  return goodChars.join("");
}

/** Gets the value of the XML node as a number */
export function getNumber(node: { "#text": number }): number | null {
  if (typeof node !== "undefined" && typeof node["#text"] === "number") {
    return node["#text"];
  }
  if (typeof node === "number") {
    return node;
  }
  return null;
}

/** Gets the attribute value from a give node. Returns null if the attribute does not exist */
export function getAttribute(node: { attr: Record<string, string> }, name: string): string | null {
  if (
    typeof node !== "undefined" &&
    typeof node.attr === "object" &&
    typeof node.attr[`@_${name}`] === "string"
  ) {
    return node.attr[`@_${name}`].trim();
  }
  return null;
}

/** Gets the attribute value from a give node. It will throw if the attribute does not exist */
export function getKnownAttribute(node: { attr: Record<string, string> }, name: string): string {
  if (
    typeof node !== "undefined" &&
    typeof node.attr === "object" &&
    typeof node.attr[`@_${name}`] === "string"
  ) {
    return node.attr[`@_${name}`].trim();
  }
  throw new Error(`Known attribute ${name} was not found in the node.`);
}

export function extractOptionalStringAttribute(
  node: { attr: Record<string, string> },
  attrName: string,
  key = attrName
): EmptyObj | { [key: string]: string } {
  const val = getAttribute(node, attrName);

  if (val) {
    return { [key]: val };
  }
  return {};
}

export function extractOptionalNumberAttribute(
  node: { attr: Record<string, string> },
  attrName: string,
  key = attrName
): EmptyObj | { [key: string]: number } {
  const val = getAttribute(node, attrName);

  if (val) {
    return { [key]: parseInt(val, 10) };
  }
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StringEnum = { [key: string]: any };
// eslint-disable-next-line @typescript-eslint/ban-types
function keysOf<K extends {}>(o: K): (keyof K)[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keysOf(o: any) {
  return Object.keys(o);
}

export function lookup<E extends StringEnum>(stringEnum: E, s: string): E[keyof E] | undefined {
  // eslint-disable-next-line no-restricted-syntax
  for (const enumKey of keysOf(stringEnum)) {
    if (stringEnum[enumKey] === s) {
      // here we have to help the compiler
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-return
      return stringEnum[enumKey] as E[keyof E];
    }
  }
  return undefined;
}
