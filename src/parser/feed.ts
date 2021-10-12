/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// title
// link
// language
// copyright
// description
// image
// explicit
// type
// subtitle
// author
// summary
// encoded
// owner
// - name
// - email
// itunes:image
// category
// generator
// pubDate
// itunes keywords

import {
  ensureArray,
  FeedObject,
  FeedType,
  firstWithAttributes,
  firstWithValue,
  getAttribute,
  getKnownAttribute,
  getText,
  pubDateToDate,
  sanitizeMultipleSpaces,
  sanitizeNewLines,
} from "./shared";

function getTitle(feed: XmlNode): string {
  const node = firstWithValue(feed.title);

  return sanitizeMultipleSpaces(sanitizeNewLines(getText(node)));
}

function getDescription(feed: XmlNode): string {
  const node = firstWithValue(feed.description);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }

  const fallbackNode = firstWithValue(feed["itunes:summary"]);
  if (fallbackNode) {
    const nodeValue = getText(fallbackNode);
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }
  return "";
}

function getLink(feed: XmlNode): string {
  const node = firstWithValue(feed.link);

  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }

  const nodeWithAttribute = firstWithAttributes(feed.link, ["href"]);
  if (nodeWithAttribute) {
    const nodeValue = getKnownAttribute(nodeWithAttribute, "href");
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }

  const fallbackNode = firstWithValue(feed.url);

  if (fallbackNode) {
    const nodeValue = getText(fallbackNode);
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }

  return "";
}

function getExplicit(feed: XmlNode): boolean {
  const node = firstWithValue(feed["itunes:explicit"]);
  const nodeText = getText(node).toLowerCase();

  if (["yes", "true"].includes(nodeText)) {
    return true;
  }
  if (typeof node === "boolean" && node) {
    return true;
  }
  return false;
}

function getLanguage(feed: XmlNode): undefined | { language: string } {
  const node = firstWithValue(feed.language);

  const value = getText(node);
  if (value) {
    return { language: value };
  }
  return undefined;
}

function getItunesImage(feed: XmlNode): undefined | { itunesImage: string } {
  const target = feed["itunes:image"];
  const node = ensureArray(target).find((imageNode) => getText(imageNode.url));

  if (node) {
    const value = getText(node.url);
    if (value) {
      return { itunesImage: value };
    }
  }

  const fallback = firstWithAttributes(target, ["href"]);
  if (fallback) {
    return { itunesImage: getKnownAttribute(target, "href") };
  }

  const lastFallback = firstWithValue(target);
  if (lastFallback) {
    const value = getText(lastFallback);
    if (value) {
      return { itunesImage: value };
    }
  }

  return undefined;
}

function getItunesCategory(feed: XmlNode): undefined | { itunesCategory: string[] } {
  const getCategories = (node: XmlNode) => ensureArray(node["itunes:category"]);

  const topLevelCategories = getCategories(feed);
  if (topLevelCategories.length === 0) {
    return undefined;
  }

  const categories = new Set<string>();
  topLevelCategories.forEach((cat) => {
    const categoryName = (getAttribute(cat, "text") ?? "").toLowerCase();
    if (categoryName) {
      categories.add(categoryName);
    }
    if (getCategories(cat).length > 0) {
      getCategories(cat).forEach((subCat) => {
        const subCategoryName = (getAttribute(subCat, "text") ?? "").toLowerCase();
        if (subCategoryName) {
          categories.add(`${categoryName} > ${subCategoryName}`);
        }
      });
    }
  });

  if (categories.size === 0) {
    return undefined;
  }
  return { itunesCategory: Array.from(categories) };
}

function getGenerator(feed: XmlNode): undefined | { generator: string } {
  const node = firstWithValue(feed.generator);
  const nodeValue = getText(node);
  if (nodeValue) {
    return { generator: nodeValue };
  }
  return undefined;
}

function getPubDate(feed: XmlNode): undefined | { pubDate: Date } {
  const node = firstWithValue(feed.pubDate);
  const nodeValue = getText(node);
  if (nodeValue) {
    const parsed = pubDateToDate(nodeValue);
    if (parsed) {
      return { pubDate: parsed };
    }
  }

  const fallbackNode = firstWithValue(feed.lastBuildDate);
  const fallbackNodeValue = getText(fallbackNode);
  if (fallbackNodeValue) {
    const parsed = pubDateToDate(fallbackNodeValue);
    if (parsed) {
      return { pubDate: parsed };
    }
  }

  return undefined;
}

function getLastBuildDate(feed: XmlNode): undefined | { lastBuildDate: Date } {
  const node = firstWithValue(feed.lastBuildDate);
  const nodeValue = getText(node);
  if (nodeValue) {
    const parsed = pubDateToDate(nodeValue);
    if (parsed) {
      return { lastBuildDate: parsed };
    }
  }
  return undefined;
}

export function handleFeed(feed: XmlNode, feedType: FeedType): Partial<FeedObject> {
  return {
    type: feedType,
    title: getTitle(feed),
    description: getDescription(feed),
    link: getLink(feed),
    explicit: getExplicit(feed),
    ...getItunesImage(feed),
    ...getLanguage(feed),
    ...getItunesCategory(feed),
    ...getGenerator(feed),
    ...getPubDate(feed),
    ...getLastBuildDate(feed),

    items: [],
    __phase: {},
  };
}
