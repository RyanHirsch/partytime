import { getText, pubDateToDate, sanitizeMultipleSpaces, sanitizeNewLines } from "../shared";
import { TODO, XmlNode } from "../types";

function parseTextTag(feedTag: string, resultKey = feedTag): { tag: string; fn: TODO } {
  return {
    tag: feedTag,
    fn(node: XmlNode) {
      return { [resultKey]: sanitizeMultipleSpaces(sanitizeNewLines(getText(node))) };
    },
  };
}

/** Falls back to summary, subtitle */
export const description = parseTextTag("description");

export const title = parseTextTag("title");

export const generator = parseTextTag("generator");

export const copyright = parseTextTag("copyright");

export const webmaster = parseTextTag("webMaster", "webmaster");

export const managingEditor = parseTextTag("managingEditor");

/** Falls back to itunes:subtitle */
export const subtitle = parseTextTag("subtitle");

/** Falls back to link[href], url */
export const link = parseTextTag("link");

export const language = parseTextTag("language");

export const pubDate = {
  tag: "pubDate",
  fn(node: XmlNode): { pubDate: Date } | undefined {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = pubDateToDate(nodeValue);
      if (parsed) {
        return { pubDate: parsed };
      }
    }

    // const fallbackNode = firstWithValue(feed.lastBuildDate);
    // const fallbackNodeValue = getText(fallbackNode);
    // if (fallbackNodeValue) {
    //   const parsed = pubDateToDate(fallbackNodeValue);
    //   if (parsed) {
    //     return { pubDate: parsed };
    //   }
    // }

    // const atomFallbackNode = firstWithValue(feed.updated);
    // const atomFallbackNodeValue = getText(atomFallbackNode);
    // if (atomFallbackNodeValue) {
    //   const parsed = pubDateToDate(atomFallbackNodeValue);
    //   if (parsed) {
    //     return { pubDate: parsed };
    //   }
    // }

    return undefined;
  },
};

export const lastBuildDate = {
  tag: "pubDate",
  fn(node: XmlNode): { lastBuildDate: Date } | undefined {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = pubDateToDate(nodeValue);
      if (parsed) {
        return { lastBuildDate: parsed };
      }
    }

    return undefined;
  },
};
