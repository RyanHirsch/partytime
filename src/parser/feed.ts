/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { logger } from "../logger";

import {
  ensureArray,
  firstWithAttributes,
  firstWithValue,
  getAttribute,
  getKnownAttribute,
  getNumber,
  getText,
  lookup,
  pubDateToDate,
  sanitizeMultipleSpaces,
  sanitizeNewLines,
} from "./shared";
import { BasicFeed, ItunesFeedType } from "./types";
import type { FeedType, XmlNode } from "./types";
import { categoryLookup } from "./itunes-categories";

function getTitle(feed: XmlNode): string {
  const node = firstWithValue(feed.title);

  return sanitizeMultipleSpaces(sanitizeNewLines(getText(node) || `${getNumber(node) ?? ""}`));
}

function getDescription(feed: XmlNode): string {
  const node = firstWithValue(feed.description);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return sanitizeMultipleSpaces(sanitizeNewLines(nodeValue));
    }
  }

  const fallbackNode = getSummary(feed);
  if (fallbackNode) {
    return fallbackNode.summary;
  }

  const atomFallback = getSubtitle(feed);
  if (atomFallback) {
    return atomFallback.subtitle;
  }

  return "";
}

function getCopyright(feed: XmlNode): undefined | { copyright: string } {
  const node = firstWithValue(feed.copyright);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { copyright: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
}

function getWebmaster(feed: XmlNode): undefined | { webmaster: string } {
  const node = firstWithValue(feed.webMaster);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { webmaster: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
}

function getManagingEditor(feed: XmlNode): undefined | { managingEditor: string } {
  const node = firstWithValue(feed.managingEditor);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { managingEditor: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
}

function getSummary(feed: XmlNode): undefined | { summary: string } {
  const node = firstWithValue(feed["itunes:summary"]);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { summary: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
}

function getSubtitle(feed: XmlNode): undefined | { subtitle: string } {
  const node = firstWithValue(feed.subtitle);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { subtitle: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  const fallbackNode = firstWithValue(feed["itunes:subtitle"]);
  if (fallbackNode) {
    const nodeValue = getText(fallbackNode);
    if (nodeValue) {
      return { subtitle: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
}

function getItunesTitle(feed: XmlNode): undefined | { itunesTitle: string } {
  const node = firstWithValue(feed["itunes:title"]);
  if (node) {
    const nodeValue = getText(node);
    if (nodeValue) {
      return { itunesTitle: sanitizeMultipleSpaces(sanitizeNewLines(nodeValue)) };
    }
  }
  return undefined;
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

function getBoolean(item: XmlNode, truthyValues: string[]): boolean {
  const node = firstWithValue(item);
  const nodeText = getText(node).toLowerCase();
  const normalizedTruthy = truthyValues.map((x) => x.toLowerCase());
  if (normalizedTruthy.includes(nodeText)) {
    return true;
  }
  if (normalizedTruthy.includes("true") && typeof node === "boolean" && node) {
    return true;
  }
  return false;
}

function getExplicit(feed: XmlNode): boolean {
  return getBoolean(feed["itunes:explicit"], ["yes", "true"]);
}
function getItunesBlock(feed: XmlNode): boolean {
  return getBoolean(feed["itunes:block"], ["yes"]);
}
function getItunesComplete(feed: XmlNode): boolean {
  return getBoolean(feed["itunes:complete"], ["yes"]);
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
    return { itunesImage: getKnownAttribute(fallback, "href") };
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
  const getCategoriesNode = (node: XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node["itunes:category"]);

  const normalize = (str: string): string => str.toLowerCase().replace("&amp;", "&");
  const categoriesSet = new Set<string>();

  const extractCategories = (currentNode: XmlNode, parents: string[]): void => {
    const categories = getCategoriesNode(currentNode);

    if (categories.length > 0) {
      categories.forEach((cat) => {
        const categoryName = normalize(getAttribute(cat, "text") ?? "");
        if (categoryName) {
          extractCategories(cat, [...parents, categoryName]);
        }
      });
    } else if (parents.length > 0) {
      categoriesSet.add(parents.join(" > "));
    }
  };

  extractCategories(feed, []);

  if (categoriesSet.size === 0) {
    return undefined;
  }
  return {
    itunesCategory: Array.from(categoriesSet).map(categoryLookup).filter(Boolean) as string[],
  };
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

  const atomFallbackNode = firstWithValue(feed.updated);
  const atomFallbackNodeValue = getText(atomFallbackNode);
  if (atomFallbackNodeValue) {
    const parsed = pubDateToDate(atomFallbackNodeValue);
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

function getItunesType(feed: XmlNode): undefined | { itunesType: ItunesFeedType } {
  const node = firstWithValue(feed["itunes:type"]);
  const nodeValue = getText(node);
  if (nodeValue) {
    const parsed = lookup(ItunesFeedType, nodeValue.toLowerCase());
    if (parsed) {
      return { itunesType: parsed };
    }
  }

  const fallbackNode = firstWithAttributes(feed["itunes:type"], ["text"]);
  if (fallbackNode) {
    const parsed = lookup(ItunesFeedType, getKnownAttribute(fallbackNode, "text").toLowerCase());
    if (parsed) {
      return { itunesType: parsed };
    }
  }
  return undefined;
}

function getItunesNewFeedUrl(feed: XmlNode): undefined | { itunesNewFeedUrl: string } {
  const node = firstWithValue(feed["itunes:new-feed-url"]);
  const nodeValue = getText(node);
  if (nodeValue) {
    return { itunesNewFeedUrl: nodeValue };
  }
  return undefined;
}

const allowedCategories = new Set([
  "arts",
  "books",
  "design",
  "fashion",
  "beauty",
  "food",
  "performing",
  "visual",
  "business",
  "careers",
  "entrepreneurship",
  "investing",
  "management",
  "marketing",
  "nonprofit",
  "comedy",
  "interviews",
  "improv",
  "standup",
  "education",
  "courses",
  "howto",
  "language",
  "learning",
  "selfimprovement",
  "fiction",
  "drama",
  "history",
  "health",
  "fitness",
  "alternative",
  "medicine",
  "mental",
  "nutrition",
  "sexuality",
  "kids",
  "family",
  "parenting",
  "pets",
  "animals",
  "stories",
  "leisure",
  "animation",
  "manga",
  "automotive",
  "aviation",
  "crafts",
  "games",
  "hobbies",
  "home",
  "garden",
  "videogames",
  "music",
  "commentary",
  "news",
  "daily",
  "entertainment",
  "government",
  "politics",
  "buddhism",
  "christianity",
  "hinduism",
  "islam",
  "judaism",
  "religion",
  "spirituality",
  "science",
  "astronomy",
  "chemistry",
  "earth",
  "life",
  "mathematics",
  "natural",
  "nature",
  "physics",
  "social",
  "society",
  "culture",
  "documentary",
  "personal",
  "journals",
  "philosophy",
  "places",
  "travel",
  "relationships",
  "sports",
  "baseball",
  "basketball",
  "cricket",
  "fantasy",
  "football",
  "golf",
  "hockey",
  "rugby",
  "running",
  "soccer",
  "swimming",
  "tennis",
  "volleyball",
  "wilderness",
  "wrestling",
  "technology",
  "truecrime",
  "tv",
  "film",
  "aftershows",
  "reviews",
  "climate",
  "weather",
  "tabletop",
  "role-playing",
  "cryptocurrency",
]);
const allowedCompoundCategories = new Map<string, { others: string[]; result: string }>([
  ["video", { others: ["games"], result: "videogames" }],
  ["true", { others: ["crime"], result: "truecrime" }],
  ["after", { others: ["shows"], result: "aftershows" }],
  ["self", { others: ["improvement"], result: "selfimprovement" }],
  ["how", { others: ["to"], result: "howto" }],
]);
const handleCompoundCategory = (
  categoryName: string,
  categoriesList: string[],
  categoriesSet: Set<string>
): void => {
  const compoundCategory = allowedCompoundCategories.get(categoryName);
  if (compoundCategory) {
    if (
      compoundCategory.others.every((o) => categoriesList.includes(o)) &&
      allowedCategories.has(compoundCategory.result)
    ) {
      categoriesSet.add(compoundCategory.result);
    } else {
      logger.warn(`Compound category wasn't in the allow list - ${compoundCategory.result}`);
    }
  }
};
function getCategories(feed: XmlNode): undefined | { categories: string[] } {
  const split = (str: string): string[] =>
    str
      .replace(/-/g, "")
      .split("&amp;")
      .reduce((acc: string[], curr: string) => [...acc, ...curr.split(/\s+&\s+/)], [])
      .reduce((acc: string[], curr: string) => [...acc, ...curr.split(/\s+/)], [])
      .map((s) => s.trim())
      .filter(Boolean);
  const getCategoriesNode = (node: XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node["itunes:category"]);

  const normalize = (str: string): string => str.toLowerCase();
  const categoriesSet = new Set<string>();

  const extractCategories = (currentNode: XmlNode): void => {
    const categories = getCategoriesNode(currentNode);

    if (categories.length > 0) {
      categories.forEach((cat) => {
        const categoryName = normalize(getAttribute(cat, "text") ?? "");
        if (categoryName) {
          split(categoryName).forEach((normalizedCategoryName, _idx, all) => {
            if (allowedCompoundCategories.has(normalizedCategoryName)) {
              handleCompoundCategory(normalizedCategoryName, all, categoriesSet);
            } else if (allowedCategories.has(normalizedCategoryName)) {
              categoriesSet.add(normalizedCategoryName);
            }
          });
          extractCategories(cat);
        }
      });
    }
  };

  extractCategories(feed);

  if (categoriesSet.size === 0) {
    return undefined;
  }
  return { categories: Array.from(categoriesSet) };

  return undefined;
}

function getPubSub(
  feed: XmlNode
): undefined | { pubsub: { hub?: string; self?: string; next?: string } } {
  const getNode = (key: string, type: string): XmlNode | null =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(feed[key]).find((n) => getAttribute(n, "href") && getAttribute(n, "rel") === type);

  const selfNode = getNode("atom:link", "self") ?? getNode("link", "self");
  const hubNode = getNode("atom:link", "hub") ?? getNode("link", "hub");
  const nextNode = getNode("atom:link", "next") ?? getNode("link", "next");

  if (!selfNode && !hubNode && !nextNode) {
    return undefined;
  }
  const pubsub: { hub?: string; self?: string; next?: string } = {};

  if (selfNode) {
    pubsub.self = getKnownAttribute(selfNode, "href");
  }
  if (hubNode) {
    pubsub.hub = getKnownAttribute(hubNode, "href");
  }
  if (nextNode) {
    pubsub.next = getKnownAttribute(nextNode, "href");
  }
  return { pubsub };
}

function getAuthor(feed: XmlNode): undefined | { author: string } {
  const node = firstWithValue(feed["itunes:author"]);

  if (node) {
    return { author: getText(node) };
  }
  return undefined;
}

function getOwner(feed: XmlNode): undefined | { owner: { name: string; email: string } } {
  const node = ensureArray(feed["itunes:owner"]).find(
    (n) => firstWithValue(n["itunes:name"]) && firstWithValue(n["itunes:email"])
  );

  if (node) {
    const name = firstWithValue(node["itunes:name"]);
    const email = firstWithValue(node["itunes:email"]);
    return {
      owner: {
        name: getText(name),
        email: getText(email),
      },
    };
  }
  return undefined;
}

type ValidImage = {
  image: {
    url: string;
    title?: string;
    link?: string;
    width?: number;
    height?: number;
  };
};
function getImage(feed: XmlNode): undefined | ValidImage {
  const nodeWithUrl = ensureArray(feed.image).find((n) => getText(n.url));

  if (nodeWithUrl) {
    const result: ValidImage = { image: { url: getText(firstWithValue(nodeWithUrl.url)) } };
    const title = firstWithValue(nodeWithUrl.title);
    if (title) {
      result.image.title = getText(title);
    }
    const link = firstWithValue(nodeWithUrl.link);
    if (link) {
      result.image.link = getText(link);
    }
    const width = firstWithValue(nodeWithUrl.width);
    if (width) {
      result.image.width = getNumber(width) ?? 0;
    }
    const height = firstWithValue(nodeWithUrl.height);
    if (height) {
      result.image.height = getNumber(height) ?? 0;
    }

    return result;
  }

  const itunesImage = getItunesImage(feed);
  if (itunesImage) {
    return {
      image: { url: itunesImage.itunesImage },
    };
  }

  const logoNode = firstWithValue(feed.logo);
  if (logoNode) {
    return {
      image: {
        url: getText(logoNode),
      },
    };
  }

  return undefined;
}

function getTimeToLive(feed: XmlNode): undefined | { ttl: number } {
  const node = firstWithValue(feed.ttl);
  if (node !== null) {
    const parsed = getNumber(node);
    if (parsed !== null) {
      return { ttl: parsed };
    }
  }
  return undefined;
}

export function handleFeed(feed: XmlNode, feedType: FeedType): BasicFeed {
  return {
    lastUpdate: new Date(),
    type: feedType,
    title: getTitle(feed),
    description: getDescription(feed),
    link: getLink(feed),
    explicit: getExplicit(feed),
    itunesBlock: getItunesBlock(feed),
    itunesComplete: getItunesComplete(feed),
    ...getItunesImage(feed),
    ...getLanguage(feed),
    ...getItunesCategory(feed),
    ...getGenerator(feed),
    ...getPubDate(feed),
    ...getLastBuildDate(feed),
    ...getItunesType(feed),
    ...getItunesNewFeedUrl(feed),
    ...getCategories(feed),
    ...getPubSub(feed),
    ...getAuthor(feed),
    ...getOwner(feed),
    ...getImage(feed),
    ...getSummary(feed),
    ...getSubtitle(feed),
    ...getItunesTitle(feed),
    ...getCopyright(feed),
    ...getWebmaster(feed),
    ...getManagingEditor(feed),
    ...getTimeToLive(feed),
    items: [],
    pc20support: {},
  };
}
