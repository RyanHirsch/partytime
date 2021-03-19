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

import { mergeWith, concat } from "ramda";
import {
  FeedType,
  findPubSubLinks,
  firstIfArray,
  guessEnclosureType,
  pubDateToTimestamp,
  sanitizeUrl,
  timeToSeconds,
  TODO,
  twoDotOhCompliant,
} from "./shared";
import type { FeedObject, Episode } from "./shared";

interface RSSFeed {
  rss: {
    channel: any;
  };
}

export function parseRss(theFeed: any) {
  if (typeof theFeed.rss.channel === "undefined") {
    return null;
  }

  const timeStarted = Math.floor(Date.now() / 1000);

  let feedObj: Partial<FeedObject> = {
    type: FeedType.RSS,
    title: theFeed.rss.channel.title,
    language: theFeed.rss.channel.language,
    generator: theFeed.rss.channel.generator,
    pubDate: theFeed.rss.channel.pubDate,
    lastBuildDate: theFeed.rss.channel.lastBuildDate,
    itunesType: theFeed.rss.channel["itunes:type"],
    itunesCategory: theFeed.rss.channel["itunes:category"],
    itunesNewFeedUrl: theFeed.rss.channel["itunes:new-feed-url"],
    pubsub: findPubSubLinks(theFeed.rss.channel),
    categories: [],
    value: {},
  };
  let phaseSupport: any = {};

  // Clean the title
  if (typeof feedObj.title === "string") {
    feedObj.title = feedObj.title.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Clean the link
  if (typeof feedObj.link === "string") {
    feedObj.link = feedObj.link.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Feed categories
  if (Array.isArray(theFeed.rss.channel["itunes:category"])) {
    theFeed.rss.channel["itunes:category"].forEach((item: any) => {
      if (
        typeof item === "object" &&
        typeof item.attr !== "undefined" &&
        typeof item.attr["@_text"] === "string"
      ) {
        feedObj.categories = item.attr["@_text"]
          .toLowerCase()
          .replace("&amp;", "")
          .split(/[ ]+/)
          .concat(feedObj.categories ?? []);

        // Check for sub-items
        if (
          typeof item["itunes:category"] === "object" &&
          typeof item["itunes:category"].attr !== "undefined" &&
          typeof item["itunes:category"].attr["@_text"] === "string"
        ) {
          feedObj.categories = item["itunes:category"].attr["@_text"]
            .toLowerCase()
            .replace("&amp;", "")
            .split(/[ ]+/)
            .concat(feedObj.categories ?? []);
        }
      }
    });
  } else if (
    typeof theFeed.rss.channel["itunes:category"] === "object" &&
    typeof theFeed.rss.channel["itunes:category"].attr !== "undefined" &&
    typeof theFeed.rss.channel["itunes:category"].attr["@_text"] === "string"
  ) {
    feedObj.categories = theFeed.rss.channel["itunes:category"].attr["@_text"]
      .toLowerCase()
      .replace("&amp;", "")
      .split(/[ ]+/)
      .concat(feedObj.categories ?? []);

    // Check for sub-items
    if (
      typeof theFeed.rss.channel["itunes:category"]["itunes:category"] === "object" &&
      typeof theFeed.rss.channel["itunes:category"]["itunes:category"].attr !== "undefined" &&
      typeof theFeed.rss.channel["itunes:category"]["itunes:category"].attr["@_text"] === "string"
    ) {
      feedObj.categories = theFeed.rss.channel["itunes:category"]["itunes:category"].attr["@_text"]
        .toLowerCase()
        .replace("&amp;", "")
        .split(/[ ]+/)
        .concat(feedObj.categories ?? []);
    }
  }
  feedObj.categories = [...new Set((feedObj.categories ?? []).flat(9))];

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
    typeof feedObj.itunesType === "object" &&
    typeof feedObj.itunesType.attr !== "undefined" &&
    typeof feedObj.itunesType.attr["@_text"] === "string"
  ) {
    feedObj.itunesType = feedObj.itunesType.attr["@_text"];
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
  feedObj.explicit = 0;
  if (Array.isArray(theFeed.rss.channel["itunes:explicit"])) {
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    theFeed.rss.channel["itunes:explicit"] = theFeed.rss.channel["itunes:explicit"][0];
  }
  if (
    typeof theFeed.rss.channel["itunes:explicit"] === "string" &&
    (theFeed.rss.channel["itunes:explicit"].toLowerCase() === "yes" ||
      theFeed.rss.channel["itunes:explicit"].toLowerCase() === "true")
  ) {
    feedObj.explicit = 1;
  }
  if (
    typeof theFeed.rss.channel["itunes:explicit"] === "boolean" &&
    theFeed.rss.channel["itunes:explicit"]
  ) {
    feedObj.explicit = 1;
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

  // #region Phase 1

  // Locked
  const locked = phase1.locked(theFeed);
  feedObj = mergeWith(concat, feedObj, locked.feedUpdate);
  phaseSupport = mergeWith(concat, phaseSupport, locked.phaseUpdate);

  // Funding
  const funding = phase1.funding(theFeed);
  feedObj = mergeWith(concat, feedObj, funding.feedUpdate);
  phaseSupport = mergeWith(concat, phaseSupport, funding.phaseUpdate);
  // #endregion

  // #region Phase 2

  if (typeof theFeed.rss.channel["podcast:location"] === "string") {
    twoDotOhCompliant(feedObj, 2, "location");
  }

  if (typeof theFeed.rss.channel["podcast:person"] === "string") {
    twoDotOhCompliant(feedObj, 2, "person");
  }

  // #endregion

  // #region Phase 3

  // Value block
  if (
    typeof theFeed.rss.channel["podcast:value"] !== "undefined" &&
    typeof theFeed.rss.channel["podcast:value"].attr !== "undefined"
  ) {
    twoDotOhCompliant(feedObj, 3, "value");

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
      twoDotOhCompliant(feedObj, 3, "valueRecipient");

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

    // console.log(feedObj.value);
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
      const newItem = [];
      newItem[0] = theFeed.rss.channel.item;
      // eslint-disable-next-line no-param-reassign
      theFeed.rss.channel.item = newItem;
    }

    // Items

    feedObj.items = theFeed.rss.channel.item
      .map((item: any): Episode | undefined => {
        // console.log(item);
        let itemguid = "";

        // If there is no enclosure, just skip this item and move on to the next
        if (typeof item.enclosure !== "object") {
          return undefined;
        }

        // If there is more than one enclosure in the item, just get the first one
        const enclosure = firstIfArray(item.enclosure);

        // If there is no guid in the item, then skip this item and move on
        if (typeof item.guid !== "undefined") {
          itemguid = item.guid;
          if (typeof item.guid["#text"] === "string") {
            itemguid = item.guid["#text"];
          }
        }
        if (typeof itemguid !== "string" || itemguid === "") {
          return undefined;
        }

        let newFeedItem: Episode = {
          title: item.title,
          link: item.link,
          itunesImage: "",
          itunesDuration: 0,
          itunesEpisode: item["itunes:episode"],
          itunesEpisodeType: item["itunes:episodeType"],
          itunesSeason: item["itunes:season"],
          itunesExplicit: 0,
          enclosure: {
            url: enclosure.attr["@_url"],
            length: parseInt(enclosure.attr["@_length"], 10),
            type: enclosure.attr["@_type"],
          },
          pubDate: pubDateToTimestamp(item.pubDate),
          guid: itemguid,
          description: "",
          image: "",
        };

        // Item title
        if (typeof item.title === "string") {
          newFeedItem.title = item.title.trim();
        } else {
          newFeedItem.title = "";
        }
        if (typeof item["itunes:title"] !== "undefined" && item["itunes:title"]) {
          newFeedItem.title = item["itunes:title"];
        }

        // Item link
        if (typeof item.link === "object") {
          if (typeof item.link["#text"] === "string") {
            newFeedItem.link = item.link["#text"];
          }
          if (
            typeof item.link.attr !== "undefined" &&
            (typeof item.link.attr["@_href"] === "string" || item.link.attr["@_href"] !== "")
          ) {
            newFeedItem.link = item.link.attr["@_href"];
          }
        }
        if (typeof item.link !== "string") {
          newFeedItem.link = "";
        }

        // Item image
        let itunesImage = "";
        if (typeof item["itunes:image"] === "object") {
          if (typeof item["itunes:image"].url === "string") {
            itunesImage = item["itunes:image"].url;
          }
          if (
            typeof item["itunes:image"].attr !== "undefined" &&
            typeof item["itunes:image"].attr["@_href"] === "string"
          ) {
            itunesImage = item["itunes:image"].attr["@_href"];
          }
        }
        if (typeof item["itunes:image"] === "string") {
          itunesImage = item["itunes:image"];
        }
        newFeedItem.itunesImage = sanitizeUrl(itunesImage);

        let image = "";
        if (typeof item.image !== "undefined" && typeof item.image.url === "string") {
          image = item.image.url;
        }
        if (!image && newFeedItem.itunesImage) {
          image = newFeedItem.itunesImage;
        }
        newFeedItem.image = sanitizeUrl(image);

        // Itunes specific stuff
        if (
          typeof item["itunes:explicit"] === "string" &&
          (item["itunes:explicit"].toLowerCase() === "yes" ||
            item["itunes:explicit"].toLowerCase() === "true")
        ) {
          newFeedItem.itunesExplicit = 1;
        }
        if (typeof item["itunes:explicit"] === "boolean" && item["itunes:explicit"]) {
          newFeedItem.itunesExplicit = 1;
        }
        if (typeof item["itunes:duration"] !== "undefined") {
          if (typeof item["itunes:duration"] === "string") {
            newFeedItem.itunesDuration = timeToSeconds(item["itunes:duration"]);
            if (Number.isNaN(newFeedItem.itunesDuration)) {
              newFeedItem.itunesDuration = 0;
            }
          } else if (typeof item["itunes:duration"] === "number") {
            newFeedItem.itunesDuration = item["itunes:duration"];
          }
        }

        if (typeof item.itunesEpisode === "string") {
          const parsedString = item.itunesEpisode.replace(/\D/g, "");
          if (parsedString) {
            newFeedItem.itunesEpisode = parseInt(parsedString, 10);
          }
        }

        if (Array.isArray(item.itunesEpisodeType)) {
          // eslint-disable-next-line prefer-destructuring
          newFeedItem.itunesEpisodeType = item.itunesEpisodeType[0];
        }
        if (
          typeof item.itunesEpisodeType === "object" &&
          typeof item.itunesEpisodeType["#text"] === "string"
        ) {
          newFeedItem.itunesEpisodeType = item.itunesEpisodeType["#text"];
        }
        if (Array.isArray(item.itunesSeason)) {
          // eslint-disable-next-line prefer-destructuring
          newFeedItem.itunesSeason = item.itunesSeason[0];
        }
        if (
          typeof item.itunesSeason === "object" &&
          typeof item.itunesSeason["#text"] === "string"
        ) {
          newFeedItem.itunesSeason = item.itunesSeason["#text"];
        }

        // Item description
        if (typeof item["itunes:summary"] !== "undefined" && item["itunes:summary"]) {
          newFeedItem.description = item["itunes:summary"];
        }
        if (typeof item.description !== "undefined" && item.description) {
          if (typeof item.description["content:encoded"] !== "undefined") {
            newFeedItem.description = item.description["content:encoded"];
          } else {
            newFeedItem.description = item.description;
          }
        }
        if (typeof item.description === "string") {
          newFeedItem.description = item.description.trim();
        }

        // Enclosure
        if (Number.isNaN(parseInt(enclosure.attr["@_length"], 10))) {
          newFeedItem.enclosure.length = 0;
        }
        if (typeof enclosure.attr["@_type"] === "undefined" || !enclosure.attr["@_type"]) {
          newFeedItem.enclosure.type = guessEnclosureType(enclosure.attr["@_url"]);
        }

        // #region Item Phase 1

        const transcripts = phase1.transcripts(item);
        newFeedItem = mergeWith(concat, newFeedItem, transcripts.itemUpdate);
        phaseSupport = mergeWith(concat, phaseSupport, transcripts.phaseUpdate);
        // #endregion

        // Chapters Phase 1
        if (
          typeof item["podcast:chapters"] !== "undefined" &&
          typeof item["podcast:chapters"].attr === "object" &&
          typeof item["podcast:chapters"].attr["@_url"] === "string"
        ) {
          twoDotOhCompliant(feedObj, 1, "chapters");

          newFeedItem.podcastChapters = {
            url: item["podcast:chapters"].attr["@_url"],
            type: 0,
          };
        }

        // Soundbites
        if (Array.isArray(item["podcast:soundbite"])) {
          twoDotOhCompliant(feedObj, 1, "soundbites");

          newFeedItem.podcastSoundbites = [];
          item["podcast:soundbite"].forEach(function (soundbite: any) {
            if (
              typeof soundbite !== "undefined" &&
              typeof soundbite.attr === "object" &&
              typeof soundbite.attr["@_startTime"] !== "undefined" &&
              typeof soundbite.attr["@_duration"] !== "undefined"
            ) {
              newFeedItem.podcastSoundbites.push({
                startTime: soundbite.attr["@_startTime"],
                duration: soundbite.attr["@_duration"],
                title: soundbite["#text"],
              });
              // console.log(soundbite);
              // console.log(feedObj.items[i].podcastSoundbites);
            }
          });
        } else if (
          typeof item["podcast:soundbite"] !== "undefined" &&
          typeof item["podcast:soundbite"].attr === "object" &&
          typeof item["podcast:soundbite"].attr["@_startTime"] !== "undefined" &&
          typeof item["podcast:soundbite"].attr["@_duration"] !== "undefined"
        ) {
          twoDotOhCompliant(feedObj, 1, "soundbites");

          newFeedItem.podcastSoundbites = {
            startTime: item["podcast:soundbite"].attr["@_startTime"],
            duration: item["podcast:soundbite"].attr["@_duration"],
            title: item["podcast:soundbite"]["#text"],
          };
          // console.log(item["podcast:soundbite"]);
          // console.log(feedObj.items[i].podcastSoundbites);
        }
        return newFeedItem;
      })
      .filter((x: Episode | undefined) => x);

    // Get the pubdate of the most recent item
    let mostRecentPubDate = 0;
    feedObj.items?.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.pubDate);
      if (thisPubDate > mostRecentPubDate && thisPubDate <= timeStarted) {
        mostRecentPubDate = thisPubDate;
      }
      // console.log(item.pubDate + ": " + pubDateToTimestamp(item.pubDate));
    });
    feedObj.newestItemPubDate = mostRecentPubDate;

    // Get the pubdate of the oldest item
    let oldestPubDate = mostRecentPubDate;
    feedObj.items?.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.pubDate);
      if (thisPubDate < oldestPubDate && thisPubDate > 0) {
        oldestPubDate = thisPubDate;
      }
      // console.log(item.pubDate + ": " + pubDateToTimestamp(item.pubDate));
    });
    feedObj.oldestItemPubDate = oldestPubDate;
  }

  // Duplicate pubdate?
  let pubDate = firstIfArray(theFeed.rss.channel.pubDate);
  // Make sure we have a valid pubdate if possible
  if (typeof pubDate === "string") {
    pubDate = pubDateToTimestamp(pubDate);
  }

  // eslint-disable-next-line eqeqeq
  if (!pubDate || Number.isNaN(pubDate)) {
    if (typeof feedObj.lastBuildDate !== "string") {
      pubDate = 0;
    } else {
      pubDate = feedObj.lastBuildDate;
    }
  }
  if (
    typeof feedObj.newestItemPubDate === "number" &&
    (typeof pubDate !== "number" || pubDate === 0)
  ) {
    pubDate = feedObj.newestItemPubDate;
  }

  feedObj.pubDate = pubDate;

  // eslint-disable-next-line no-underscore-dangle
  feedObj.__phase = phaseSupport;
  return feedObj;
}

interface PhaseUpdate {
  [p: number]: { [k: string]: boolean };
}
export const phase1 = {
  locked: (theFeed: RSSFeed) => {
    const node = theFeed.rss.channel["podcast:locked"];
    const lockedValues = ["yes", "true"];

    const feedUpdate: any = { podcastLocked: 0 };
    const phaseUpdate: PhaseUpdate = { 1: {} };

    if (typeof node === "object") {
      phaseUpdate[1].locked = true;

      const lockedText = getText(node).toLowerCase();
      const owner = getAttribute(node, "owner");
      const email = getAttribute(node, "email");

      if (lockedValues.includes(lockedText)) {
        feedUpdate.podcastLocked = 1;
      }
      if (owner) {
        feedUpdate.podcastOwner = owner;
      }
      if (email) {
        feedUpdate.podcastOwner = email;
      }
    }

    return { feedUpdate, phaseUpdate };
  },

  funding: (theFeed: RSSFeed) => {
    const node = theFeed.rss.channel["podcast:funding"];
    const feedUpdate: any = {};
    const phaseUpdate: PhaseUpdate = { 1: {} };

    if (typeof node === "object") {
      phaseUpdate[1].funding = true;

      const message = getText(node);
      const url = getAttribute(node, "url");

      if (url) {
        feedUpdate.podcastFunding = {
          message: message ?? "",
          url,
        };
      }
    }
    return { feedUpdate, phaseUpdate };
  },

  transcripts: (item: TODO) => {
    const node = firstIfArray(item["podcast:transcript"]);
    const itemUpdate: any = {};
    const phaseUpdate: PhaseUpdate = { 1: {} };

    const url = getAttribute(node, "url");

    if (url) {
      phaseUpdate[1].transcript = true;

      itemUpdate.podcastTranscripts = {
        url,
        type: 0,
      };
    }

    return { itemUpdate, phaseUpdate };
  },
};

function getText(node: { "#text": string }): string {
  if (typeof node["#text"] === "string") {
    return node["#text"].trim();
  }
  return "";
}

function getAttribute(node: { attr: Record<string, string> }, name: string): string | null {
  if (
    typeof node !== "undefined" &&
    typeof node.attr === "object" &&
    typeof node.attr[`@_${name}`] === "string"
  ) {
    return node.attr[`@_${name}`].trim();
  }
  return null;
}
