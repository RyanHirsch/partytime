/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { ItunesFeedType } from "./types";
import type { FeedObject, FeedType, XmlNode } from "./types";

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
    } else {
      categoriesSet.add(parents.join(" > "));
    }
  };

  extractCategories(feed, []);

  if (categoriesSet.size === 0) {
    return undefined;
  }
  return { itunesCategory: Array.from(categoriesSet) };
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

function getCategories(_feed: XmlNode): undefined | { categories: string[] } {
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

export function handleFeed(feed: XmlNode, feedType: FeedType): FeedObject {
  return {
    lastUpdate: new Date(),
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
    ...getItunesType(feed),
    ...getItunesNewFeedUrl(feed),
    ...getCategories(feed),
    ...getPubSub(feed),
    ...getAuthor(feed),
    ...getOwner(feed),
    ...getImage(feed),
    ...getSummary(feed),
    ...getSubtitle(feed),

    items: [],
    pc20support: {},
  };
}
