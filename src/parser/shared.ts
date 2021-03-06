/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { PersonGroup, PersonRole } from "./person-enum";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TODO = any;

export interface RSSFeed {
  rss: {
    channel: any;
  };
}

export interface Location {
  /** This is meant for podcast apps to display the name of the location that the podcast is about. */
  name: string;
  /** From an OpenStreetMap query. If a value is given for osm it must contain both 'type' and 'id'. */
  osm?: string;
  /** A geo URI, conformant to RFC 5870 */
  geo?: string;
}

export interface Person {
  name: string;
  /** Used to identify what role the person serves on the show or episode. This should be a reference to an official role within the Podcast Taxonomy Project list */
  role: PersonRole;
  /** This should be a reference to an official group within the Podcast Taxonomy Project list */
  group: PersonGroup;
  /** This is the url of a picture or avatar of the person */
  img?: string;
  /** The url to a relevant resource of information about the person, such as a homepage or third-party profile platform. */
  href?: string;
}

export enum FeedType {
  RSS = 0,
  ATOM = 1,
  BadFormat = 9,
}

export interface FeedObject {
  type: FeedType;
  title: string;
  link: string;
  language: string;
  generator: string;
  /** Seconds from epoch */
  pubDate: number;
  /** seconds from epoch */
  lastBuildDate: number;
  lastUpdate: number;

  itunesType: TODO;
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

  explicit: 0 | 1;

  description: string;

  podcastLocked: 0 | 1;
  podcastOwner: string;

  podcastFunding: {
    message: string;
    url: string;
  };
  podcastPersons?: Person[];

  // https://github.com/Podcastindex-org/podcast-namespace/blob/main/location/location.md
  podcastLocation?: Location;

  /** podcasting 2.0 phase compliance */
  __phase: Record<number, string[]>;

  items: Episode[];
  newestItemPubDate: number;
  oldestItemPubDate: number;
}

export interface Episode {
  title: string;
  link: string;
  itunesDuration: number;
  itunesEpisode: number;
  itunesEpisodeType: TODO;
  itunesExplicit: 0 | 1;
  itunesImage: string;
  itunesSeason: TODO;
  enclosure: {
    url: string;
    length: number;
    type: string;
  };
  /** Seconds from epoch */
  pubDate: number;
  guid: string;
  description: string;
  image: string;
  podcastChapters?: { url: string; type: 0 };
  podcastSoundbites?: SoundBite[];
  podcastTranscripts?: Transcript[];
  podcastLocation?: Location;
  podcastPeople?: Person[];
  podcastSeason?: PodcastSeasonNumber;
  podcastEpisode?: PodcastEpisodeNumber;
}

export interface PodcastEpisodeNumber {
  number: number;
  display?: string;
}
export interface PodcastSeasonNumber {
  number: number;
  name?: string;
}

export interface SoundBite {
  duration: string;
  startTime: string;
  title?: string;
}

export interface Transcript {
  url: string;
  type: TranscriptType;
  language?: string;
  rel?: "captions";
}

export enum TranscriptType {
  Plain = "text/plain",
  HTML = "text/html",
  SRT = "application/srt",
  JSON = "application/json",
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

export function getText(node: { "#text": string }): string {
  if (typeof node !== "undefined" && typeof node["#text"] === "string") {
    return node["#text"].trim();
  }
  return "";
}

export function getNumber(node: { "#text": number }): number | null {
  if (typeof node !== "undefined" && typeof node["#text"] === "number") {
    return node["#text"];
  }
  if (typeof node === "number") {
    return node;
  }
  return null;
}

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
