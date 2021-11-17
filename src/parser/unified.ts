/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import mergeWith from "ramda/src/mergeWith";
import concat from "ramda/src/concat";
import mergeDeepRight from "ramda/src/mergeDeepRight";

import { logger } from "../logger";

import { ensureArray } from "./shared";
import type { Episode, FeedType, PhaseUpdate, XmlNode } from "./types";
import { updateFeed, updateItem } from "./phase";
import { handleItem, isValidItem } from "./item";
import { handleFeed } from "./feed";
import { supportedNamespaces } from "./supported-namespaces";

export function unifiedParser(theFeed: XmlNode, type: FeedType) {
  const epochDate = new Date(0);
  if (typeof theFeed.rss.channel === "undefined") {
    logger.warn("Provided XML has no channel node, unparsable");
    return null;
  }

  const namespaces = Object.keys(theFeed.rss.attr)
    .filter((k) => k.startsWith("@_xmlns:"))
    .map((nsDeclaration) => ({
      namespace: theFeed.rss.attr[nsDeclaration].toLowerCase(),
      alias: nsDeclaration.replace("@_xmlns:", "").toLowerCase(),
    }));

  let feedObj = handleFeed(theFeed.rss.channel, type);

  Object.entries(theFeed.rss.channel).forEach(([tagName, node]) => {
    const isNamespacedTag = tagName.includes(":");
    // const hasNamespaceAttribute = Array.isArray(node)
    //   ? node.some((n) => getAttribute(n, "xmlns"))
    //   : Boolean(getAttribute(node as XmlNode, "xmlns"));

    if (isNamespacedTag) {
      const [alias, tag] = tagName.split(":");
      const knownNamespace = namespaces.find((ns) => ns.alias === alias.toLowerCase());
      if (knownNamespace && supportedNamespaces.has(knownNamespace.namespace)) {
        const monkey = supportedNamespaces.get(knownNamespace.namespace);
        const tagConfig = monkey.feed[tag];
        if (tagConfig) {
          const eligibleNodes = tagConfig.nodeTransform(ensureArray(node));
          if (eligibleNodes.length > 0) {
            Object.assign(feedObj, tagConfig.fn(eligibleNodes));
          }
        }
      }
    }
  });

  let phaseSupport: PhaseUpdate = {};

  // Feed Phase Support
  const feedResult = updateFeed(theFeed);
  feedObj = mergeWith(concat, feedObj, feedResult.feedUpdate);
  phaseSupport = mergeDeepRight(phaseSupport, feedResult.phaseUpdate);

  //------------------------------------------------------------------------
  // Are there even any items to get
  if (typeof theFeed.rss.channel.item !== "undefined") {
    // Items
    feedObj.items = ensureArray(theFeed.rss.channel.item)
      .map((item: XmlNode): Episode | undefined => {
        if (!isValidItem(item)) {
          return undefined;
        }

        let newFeedItem: Episode = handleItem(item, feedObj);

        // Item Phase Support
        const itemResult = updateItem(item, theFeed);
        newFeedItem = mergeWith(concat, newFeedItem, itemResult.itemUpdate);
        phaseSupport = mergeDeepRight(phaseSupport, itemResult.phaseUpdate);

        // Value Block Fallback
        if (!newFeedItem.value && feedObj.value) {
          newFeedItem.value = feedObj.value;
        }

        return newFeedItem;
      })
      .filter((x: Episode | undefined) => x) as Episode[];

    feedObj.newestItemPubDate = feedObj.items.reduce(
      (oldestDate, currEpisode) =>
        currEpisode.pubDate && currEpisode.pubDate > oldestDate ? currEpisode.pubDate : oldestDate,
      epochDate
    );

    feedObj.oldestItemPubDate = feedObj.items.reduce(
      (newestDate, currEpisode) =>
        currEpisode.pubDate && currEpisode.pubDate < newestDate ? currEpisode.pubDate : newestDate,
      feedObj.newestItemPubDate
    );
  } else {
    logger.warn("Provided feed has no items to parse.");
  }

  if (feedObj.newestItemPubDate && !feedObj.pubDate) {
    feedObj.pubDate = feedObj.newestItemPubDate;
  }

  if (Object.keys(phaseSupport).length > 0) {
    feedObj.pc20support = Object.entries(phaseSupport).reduce(
      (phases, [phase, kv]) => ({ ...phases, [phase]: Object.keys(kv) }),
      {}
    );
  }

  return feedObj;
}
