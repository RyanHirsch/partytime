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
import { log } from "../logger";
import {
  ensureArray,
  FeedType,
  findPubSubLinks,
  firstIfArray,
  getAttribute,
  ItunesFeedType,
  lookup,
  PhaseUpdate,
  pubDateToDate,
  RSSFeed,
  sanitizeUrl,
} from "./shared";
import type { FeedObject, Episode } from "./shared";
import { updateFeed, updateItem } from "./phase";
import { handleItem, isValidItem } from "./item";

export function parseRss(theFeed: any) {
  const epochDate = new Date(0);
  if (typeof theFeed.rss.channel === "undefined") {
    return null;
  }

  const timeStarted = new Date();

  let feedObj: Partial<FeedObject> = {
    type: FeedType.RSS,
    title: theFeed.rss.channel.title,
    language: theFeed.rss.channel.language,
    generator: theFeed.rss.channel.generator,
    pubDate: theFeed.rss.channel.pubDate,
    lastBuildDate: theFeed.rss.channel.lastBuildDate,
    itunesType: theFeed.rss.channel["itunes:type"],
    itunesCategory: getItunesCategories(theFeed),
    itunesNewFeedUrl: theFeed.rss.channel["itunes:new-feed-url"],
    pubsub: findPubSubLinks(theFeed.rss.channel),
    categories: getPodcastCategories(theFeed),
    // podcastLocked: 0,
    lastUpdate: new Date(),
    value: {},
  };
  let phaseSupport: PhaseUpdate = {};

  // Clean the title
  if (typeof feedObj.title === "string") {
    feedObj.title = feedObj.title.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Clean the link
  if (typeof feedObj.link === "string") {
    feedObj.link = feedObj.link.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Feed owner/author
  if (typeof theFeed.rss.channel["itunes:author"] !== "undefined") {
    feedObj.itunesAuthor = theFeed.rss.channel["itunes:author"];
    if (Array.isArray(feedObj.itunesAuthor)) {
      [feedObj.itunesAuthor] = feedObj.itunesAuthor;
    }
    if (
      typeof feedObj.itunesAuthor === "object" &&
      typeof feedObj.itunesAuthor["#text"] !== "undefined"
    ) {
      feedObj.itunesAuthor = feedObj.itunesAuthor["#text"];
    }
  }
  if (typeof theFeed.rss.channel["itunes:owner"] !== "undefined") {
    if (typeof theFeed.rss.channel["itunes:owner"]["itunes:email"] !== "undefined") {
      feedObj.itunesOwnerEmail = theFeed.rss.channel["itunes:owner"]["itunes:email"];
    }
    if (typeof theFeed.rss.channel["itunes:owner"]["itunes:name"] !== "undefined") {
      feedObj.itunesOwnerName = theFeed.rss.channel["itunes:owner"]["itunes:name"];
    }
  }
  if (typeof feedObj.itunesAuthor !== "string") feedObj.itunesAuthor = "";
  if (typeof feedObj.itunesOwnerEmail !== "string") feedObj.itunesOwnerEmail = "";
  if (typeof feedObj.itunesOwnerName !== "string") feedObj.itunesOwnerName = "";

  // Duplicate language?
  if (Array.isArray(feedObj.language)) {
    [feedObj.language] = feedObj.language;
  }

  // Itunes specific stuff
  if (Array.isArray(feedObj.itunesType)) {
    [feedObj.itunesType] = feedObj.itunesType;
  }
  if (typeof feedObj.itunesType === "object" && typeof feedObj.itunesType["#text"] === "string") {
    feedObj.itunesType = feedObj.itunesType["#text"];
  }
  if (
    typeof theFeed.rss.channel["itunes:type"] === "object" &&
    typeof theFeed.rss.channel["itunes:type"].attr !== "undefined" &&
    typeof theFeed.rss.channel["itunes:type"].attr["@_text"] === "string"
  ) {
    feedObj.itunesType = lookup(
      ItunesFeedType,
      theFeed.rss.channel["itunes:type"].attr["@_text"].toLowerCase()
    );
  }
  if (Array.isArray(feedObj.itunesNewFeedUrl)) {
    [feedObj.itunesNewFeedUrl] = feedObj.itunesNewFeedUrl;
  }

  // Feed generator
  if (Array.isArray(feedObj.generator)) {
    [feedObj.generator] = feedObj.generator;
  }

  // Feed image
  feedObj.itunesImage = "";
  if (typeof theFeed.rss.channel["itunes:image"] === "object") {
    if (typeof theFeed.rss.channel["itunes:image"].url === "string") {
      feedObj.itunesImage = theFeed.rss.channel["itunes:image"].url;
    }
    if (
      typeof theFeed.rss.channel["itunes:image"].attr !== "undefined" &&
      typeof theFeed.rss.channel["itunes:image"].attr["@_href"] === "string"
    ) {
      feedObj.itunesImage = theFeed.rss.channel["itunes:image"].attr["@_href"];
    }
  }
  if (typeof theFeed.rss.channel["itunes:image"] === "string") {
    feedObj.itunesImage = theFeed.rss.channel["itunes:image"];
  }
  feedObj.itunesImage = sanitizeUrl(feedObj.itunesImage);
  feedObj.image = "";
  if (
    typeof theFeed.rss.channel.image !== "undefined" &&
    typeof theFeed.rss.channel.image.url === "string"
  ) {
    feedObj.image = theFeed.rss.channel.image.url;
  }
  if (feedObj.image === "" && feedObj.itunesImage !== "") {
    feedObj.image = feedObj.itunesImage;
  }
  feedObj.image = sanitizeUrl(feedObj.image);

  // Feed explicit content
  feedObj.explicit = false;
  if (Array.isArray(theFeed.rss.channel["itunes:explicit"])) {
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    theFeed.rss.channel["itunes:explicit"] = theFeed.rss.channel["itunes:explicit"][0];
  }
  if (
    typeof theFeed.rss.channel["itunes:explicit"] === "string" &&
    (theFeed.rss.channel["itunes:explicit"].toLowerCase() === "yes" ||
      theFeed.rss.channel["itunes:explicit"].toLowerCase() === "true")
  ) {
    feedObj.explicit = true;
  }
  if (
    typeof theFeed.rss.channel["itunes:explicit"] === "boolean" &&
    theFeed.rss.channel["itunes:explicit"]
  ) {
    feedObj.explicit = true;
  }

  // Feed description
  feedObj.description = theFeed.rss.channel.description;
  if (
    typeof theFeed.rss.channel["itunes:summary"] !== "undefined" &&
    theFeed.rss.channel["itunes:summary"]
  ) {
    feedObj.description = theFeed.rss.channel["itunes:summary"];
    if (Array.isArray(theFeed.rss.channel["itunes:summary"])) {
      [feedObj.description] = theFeed.rss.channel["itunes:summary"];
    }
    if (
      typeof theFeed.rss.channel["itunes:summary"] === "object" &&
      typeof theFeed.rss.channel["itunes:summary"]["#text"] !== "undefined"
    ) {
      feedObj.description = theFeed.rss.channel["itunes:summary"]["#text"];
    }
  }
  if (typeof feedObj.description !== "string") {
    feedObj.description = "";
  }

  // Feed link
  const link = Array.isArray(theFeed.rss.channel.link)
    ? theFeed.rss.channel.link[0]
    : theFeed.rss.channel.link;

  // Clean the link
  if (typeof link === "string") {
    feedObj.link = link.trim().replace(/(\r\n|\n|\r)/gm, "");
  } else if (typeof link === "object") {
    if (typeof link["#text"] !== "undefined") {
      feedObj.link = link["#text"];
    } else if (typeof link.attr["@_href"] !== "undefined") {
      feedObj.link = link.attr["@_href"];
    } else if (
      typeof theFeed.rss.channel.url !== "undefined" &&
      theFeed.rss.channel.url === "string"
    ) {
      feedObj.link = theFeed.rss.channel.url;
    }
  } else if (typeof link !== "string") {
    feedObj.link = "";
  }

  // Feed Phase Support
  const feedResult = updateFeed(theFeed);
  feedObj = mergeWith(concat, feedObj, feedResult.feedUpdate);
  phaseSupport = mergeDeepRight(phaseSupport, feedResult.phaseUpdate);

  // Value block
  if (
    typeof theFeed.rss.channel["podcast:value"] !== "undefined" &&
    typeof theFeed.rss.channel["podcast:value"].attr !== "undefined"
  ) {
    // Get the model
    feedObj.value.model = {
      type: theFeed.rss.channel["podcast:value"].attr["@_type"],
      method: theFeed.rss.channel["podcast:value"].attr["@_method"],
      suggested: theFeed.rss.channel["podcast:value"].attr["@_suggested"],
    };

    // Get the recipients
    feedObj.value.destinations = [];
    if (typeof theFeed.rss.channel["podcast:value"]["podcast:valueRecipient"] === "object") {
      const valueRecipients = theFeed.rss.channel["podcast:value"]["podcast:valueRecipient"];
      // twoDotOhCompliant(feedObj, 3, "valueRecipient");

      if (Array.isArray(valueRecipients)) {
        valueRecipients.forEach(function (item) {
          if (typeof item.attr !== "undefined") {
            feedObj.value.destinations.push({
              name: item.attr["@_name"],
              type: item.attr["@_type"],
              address: item.attr["@_address"],
              split: item.attr["@_split"],
            });
          }
        });
      } else if (typeof valueRecipients.attr !== "undefined") {
        feedObj.value.destinations.push({
          name: valueRecipients.attr["@_name"],
          type: valueRecipients.attr["@_type"],
          address: valueRecipients.attr["@_address"],
          split: valueRecipients.attr["@_split"],
        });
      }
    }
  }
  // #endregion

  // Feed title
  if (typeof feedObj.title !== "string") {
    feedObj.title = "";
  }

  // The feed object must have an array of items even if it's blank
  feedObj.items = [];

  //------------------------------------------------------------------------
  // Are there even any items to get
  if (typeof theFeed.rss.channel.item !== "undefined") {
    // Make sure the item element is always an array
    if (!Array.isArray(theFeed.rss.channel.item)) {
      log.debug("Items is not an array, appears to be a single item. Turning it into an array");
      // eslint-disable-next-line no-param-reassign
      theFeed.rss.channel.item = [theFeed.rss.channel.item];
    }

    // Items

    feedObj.items = theFeed.rss.channel.item
      .map((item: any): Episode | undefined => {
        if (!isValidItem(item)) {
          return undefined;
        }

        let newFeedItem: Episode = handleItem(item, feedObj);

        // Enclosure
        // if (Number.isNaN(parseInt(enclosure.attr["@_length"], 10))) {
        //   newFeedItem.enclosure.length = 0;
        // }
        // if (typeof enclosure.attr["@_type"] === "undefined" || !enclosure.attr["@_type"]) {
        //   newFeedItem.enclosure.type = guessEnclosureType(enclosure.attr["@_url"]);
        // }

        // Item Phase Support
        const itemResult = updateItem(item, theFeed);
        newFeedItem = mergeWith(concat, newFeedItem, itemResult.itemUpdate);
        phaseSupport = mergeDeepRight(phaseSupport, itemResult.phaseUpdate);

        return newFeedItem;
      })
      .filter((x: Episode | undefined) => x);

    // Get the pubdate of the most recent item
    let mostRecentPubDate = epochDate;
    feedObj.items?.forEach(function (item: any) {
      const thisPubDate = pubDateToDate(item.pubDate);
      if (thisPubDate && thisPubDate > mostRecentPubDate && thisPubDate <= timeStarted) {
        mostRecentPubDate = thisPubDate;
      }
    });
    feedObj.newestItemPubDate = mostRecentPubDate;

    // Get the pubdate of the oldest item
    let oldestPubDate = mostRecentPubDate;
    feedObj.items?.forEach(function (item: any) {
      const thisPubDate = pubDateToDate(item.pubDate);
      if (thisPubDate && thisPubDate < oldestPubDate && thisPubDate > epochDate) {
        oldestPubDate = thisPubDate;
      }
    });
    feedObj.oldestItemPubDate = oldestPubDate;
  } else {
    log.debug("There are no items!");
  }

  // Duplicate pubdate?
  let pubDate = firstIfArray(theFeed.rss.channel.pubDate);
  // Make sure we have a valid pubdate if possible
  if (typeof pubDate === "string") {
    pubDate = pubDateToDate(pubDate);
  }

  if (!pubDate || Number.isNaN(pubDate.getTime())) {
    if (typeof feedObj.lastBuildDate !== "string") {
      pubDate = epochDate;
    } else {
      pubDate = pubDateToDate(feedObj.lastBuildDate);
    }
  }
  if (
    typeof feedObj.newestItemPubDate === "object" &&
    (typeof pubDate !== "object" || pubDate === epochDate)
  ) {
    pubDate = feedObj.newestItemPubDate;
  }

  feedObj.pubDate = pubDate;

  if (Object.keys(phaseSupport).length > 0) {
    // eslint-disable-next-line no-underscore-dangle
    feedObj.__phase = Object.entries(phaseSupport).reduce(
      (phases, [phase, kv]) => ({ ...phases, [phase]: Object.keys(kv) }),
      {}
    );
  }

  return feedObj;
}

function getPodcastCategories(feed: RSSFeed) {
  const node = feed.rss.channel["itunes:category"];
  log.trace("itunes:category", node);

  const transformCategoriesToList = (category: string): string[] =>
    category
      .toLowerCase()
      .replace("&amp;", "")
      .split(/\s+/)
      .filter((x) => Boolean(x));

  const categories = new Set<string>();
  // Feed categories

  ensureArray(node).forEach((item: any) => {
    transformCategoriesToList(getAttribute(item, "text") ?? "").forEach((cat) =>
      categories.add(cat)
    );
    if (item && typeof item["itunes:category"] === "object") {
      ensureArray(item["itunes:category"]).forEach((subitem: any) => {
        transformCategoriesToList(getAttribute(subitem, "text") ?? "").forEach((cat) =>
          categories.add(cat)
        );
      });
    }
  });

  return Array.from(categories);
}

function getItunesCategories(feed: RSSFeed) {
  const node = feed.rss.channel["itunes:category"];
  log.trace("itunes:category", node);

  const transformCategory = (category: string): string => category.toLowerCase();

  const categories = new Set<string>();
  // Feed categories

  ensureArray(node).forEach((item: any) => {
    const category = transformCategory(getAttribute(item, "text") ?? "");

    if (category) {
      categories.add(category);

      if (typeof item["itunes:category"] === "object") {
        ensureArray(item["itunes:category"]).forEach((subitem: any) => {
          const subcategory = transformCategory(getAttribute(subitem, "text") ?? "");

          if (subcategory) {
            categories.add(`${category} > ${subcategory}`);
          }
        });
      }
    }
  });

  return Array.from(categories);
}
