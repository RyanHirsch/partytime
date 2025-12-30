/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import type { EmptyObj } from "./types";

// import iconv from "iconv-lite";

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

export function pubDateToDate(pubDate: number | string | Date): Date | null {
  if (typeof pubDate === "number") {
    if (new Date(pubDate).getFullYear() === 1970) {
      return new Date(pubDate * 1000);
    }
    return new Date(pubDate);
  }

  const dateFromString = new Date(pubDate);
  if (Number.isNaN(dateFromString.getTime())) {
    return null;
  }
  return dateFromString;
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
    return "audio/m4a";
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

export function isNotUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

/** Returns the first value from an array, otherwise, passes the value through */
export function firstIfArray<T>(maybeArr: T | T[]): T {
  return Array.isArray(maybeArr) ? maybeArr[0] : maybeArr;
}

export function firstWithValue<T>(maybeArr: T | T[]): T | null {
  return (
    ensureArray(maybeArr).find(
      (x) =>
        typeof x !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (getText(x as any) || typeof getNumber(x as any) === "number" || typeof x === "boolean")
    ) ?? null
  );
}

export function firstWithAttributes<T>(maybeArr: T | T[], attrs: string[]): T | null {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ensureArray(maybeArr).find((x) => x && attrs.every((a) => hasAttribute(x as any, a))) ?? null
  );
}

/** Will pass through the value if its an array, otherwise, will wrap the value as an array */
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
  } else if (typeof node !== "undefined" && node !== null && typeof node["#text"] === "string") {
    text = node["#text"].trim();
  }
  if (text && sanitize) {
    text = sanitizeText(text);
  }
  return text;
}

export function sanitizeNewLines(text: string): string {
  return text.replace(/(\r\n|\n|\r)/gm, " ");
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
export function getNumber(node: { "#text": number } | number): number | null {
  if (typeof node === "number") {
    return node;
  }
  if (typeof node !== "undefined" && node && typeof node["#text"] === "number") {
    return node["#text"];
  }
  return null;
}

function hasAttribute(node: { attr: Record<string, string> }, name: string): boolean {
  if (typeof node !== "undefined" && node && typeof node.attr === "object") {
    if (typeof node.attr[`@_${name}`] === "string") {
      return Boolean(node.attr[`@_${name}`].trim());
    }
    return typeof node.attr[`@_${name}`] === "number";
  }
  return false;
}

/** Gets the attribute value from a give node. Returns null if the attribute does not exist */
export function getAttribute(node: { attr: Record<string, string> }, name: string): string | null {
  if (
    typeof node !== "undefined" &&
    node &&
    typeof node.attr === "object" &&
    typeof node.attr[`@_${name}`] === "string"
  ) {
    return node.attr[`@_${name}`].trim();
  }
  return null;
}

/** Gets the attribute value from a give node. Returns false if the attribute does not exist */
export function getBooleanAttribute(node: { attr: Record<string, string> }, name: string): boolean {
  if (
    typeof node !== "undefined" &&
    typeof node.attr === "object" &&
    typeof node.attr[`@_${name}`] === "string"
  ) {
    return /^(true|yes)$/i.test(node.attr[`@_${name}`].trim());
  }
  return false;
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

export function extractOptionalIntegerAttribute(
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

export function lookupCaseInsensitive<E extends StringEnum>(
  stringEnum: E,
  s: string
): E[keyof E] | undefined {
  const lowerInput = s.toLowerCase();
  // eslint-disable-next-line no-restricted-syntax
  for (const enumKey of keysOf(stringEnum)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (stringEnum[enumKey].toLowerCase() === lowerInput) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-return
      return stringEnum[enumKey] as E[keyof E];
    }
  }
  return undefined;
}

export function knownLookup<E extends StringEnum>(stringEnum: E, s: string): E[keyof E] {
  const lookupValue = lookup(stringEnum, s);
  if (lookupValue) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return lookupValue;
  }
  throw new Error("Known value didn't exist, ");
}

export function extractOptionalFloatAttribute(
  node: { attr: Record<string, string> },
  attrName: string,
  key = attrName
): EmptyObj | { [key: string]: number } {
  const val = getAttribute(node, attrName);

  if (val) {
    return { [key]: parseFloat(val) };
  }
  return {};
}
