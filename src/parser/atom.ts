/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  FeedType,
  findPubSubLinks,
  guessEnclosureType,
  pubDateToTimestamp,
  timeToSeconds,
} from "./shared";

export function parseAtom(theFeed: any) {
  const timeStarted = Math.floor(Date.now() / 1000);

  const feedObj: any = {};
  feedObj.type = FeedType.ATOM;

  // Key attributes
  feedObj.title = theFeed.feed.title;
  feedObj.link = theFeed.feed.link;
  feedObj.description = theFeed.feed.subtitle;
  feedObj.language = theFeed.feed.language;
  feedObj.generator = theFeed.feed.generator;
  feedObj.pubDate = theFeed.feed.updated;
  feedObj.lastBuildDate = theFeed.feed.updated;
  feedObj.itunesType = theFeed.feed["itunes:type"];
  feedObj.itunesCategory = theFeed.feed["itunes:category"];
  feedObj.itunesNewFeedUrl = theFeed.feed["itunes:new-feed-url"];
  if (typeof theFeed.feed.author === "object" && typeof theFeed.feed.author.name === "string") {
    feedObj.itunesAuthor = theFeed.feed.author.name;
    feedObj.itunesOwnerName = theFeed.feed.author.name;
  }
  if (typeof theFeed.feed.author === "object" && typeof theFeed.feed.author.email === "string") {
    feedObj.itunesOwnerEmail = theFeed.feed.author.email;
  }

  // Pubsub links?
  feedObj.pubsub = findPubSubLinks(theFeed.feed);

  // Feed title
  if (Array.isArray(theFeed.feed.title)) {
    feedObj.title = theFeed.feed.title[0];
  }
  if (typeof feedObj.title === "object" && typeof feedObj.title["#text"] === "string") {
    feedObj.title = feedObj.title["#text"];
  }
  if (typeof feedObj.title !== "string") {
    feedObj.title = "";
  }

  // Feed description
  if (Array.isArray(feedObj.description)) {
    feedObj.description = feedObj.description[0];
  }
  if (typeof feedObj.description === "object") {
    if (typeof feedObj.description["#text"] === "string") {
      feedObj.description = feedObj.description["#text"];
    }
    if (typeof feedObj.description["#html"] === "string") {
      feedObj.description = feedObj.description["#text"];
    }
  }
  if (typeof feedObj.description !== "string") {
    feedObj.description = "";
  }

  // Feed link
  if (Array.isArray(theFeed.feed.link)) {
    feedObj.link = theFeed.feed.link[0];
  }
  if (typeof feedObj.link === "object") {
    if (typeof feedObj.link["#text"] !== "undefined") {
      feedObj.link = feedObj.link["#text"];
    } else if (typeof feedObj.link.attr["@_href"] !== "undefined") {
      feedObj.link = feedObj.link.attr["@_href"];
    } else if (typeof feedObj.url !== "undefined" && feedObj.url === "string") {
      feedObj.link = feedObj.url;
    }
  }
  if (typeof feedObj.link !== "string") {
    feedObj.link = "";
  }

  // Feed generator
  if (Array.isArray(theFeed.feed.generator)) {
    feedObj.generator = theFeed.feed.generator[0];
  }
  if (typeof feedObj.generator === "object" && typeof feedObj.generator["#text"] !== "undefined") {
    feedObj.generator = feedObj.generator["#text"];
  }

  if (typeof feedObj.generator !== "string") {
    feedObj.generator = "";
  }

  // Feed explicit content
  feedObj.explicit = 0;
  if (
    typeof theFeed.feed["itunes:explicit"] === "string" &&
    (theFeed.feed["itunes:explicit"].toLowerCase() == "yes" ||
      theFeed.feed["itunes:explicit"].toLowerCase() == "true")
  ) {
    feedObj.explicit = 1;
  }
  if (typeof theFeed.feed["itunes:explicit"] === "boolean" && theFeed.feed["itunes:explicit"]) {
    feedObj.explicit = 1;
  }

  // Feed image
  feedObj.image = theFeed.feed.logo;
  if (typeof theFeed.feed["itunes:image"] !== "undefined") {
    if (typeof theFeed.feed["itunes:image"] === "object") {
      feedObj.itunesImage = theFeed.feed["itunes:image"].attr["@_href"];
    } else {
      feedObj.itunesImage = theFeed.feed["itunes:image"];
    }
  }
  feedObj.image = "";
  if (typeof theFeed.feed.image !== "undefined" && typeof theFeed.feed.image.url !== "undefined") {
    feedObj.image = theFeed.feed.image.url;
  }
  if (
    typeof feedObj.image === "undefined" &&
    typeof feedObj.itunesImage !== "undefined" &&
    feedObj.itunesImage != ""
  ) {
    feedObj.image = feedObj.itunesImage;
  }

  // The feed object must have an array of items even if it's blank
  feedObj.items = [];

  //------------------------------------------------------------------------
  // Are there even any items to get
  if (typeof theFeed.feed.entry !== "undefined") {
    // Make sure the item element is always an array
    if (!Array.isArray(theFeed.feed.entry)) {
      const newItem = [];
      newItem[0] = theFeed.feed.entry;
      theFeed.feed.entry = newItem;
    }

    // Items
    let i = 0;
    feedObj.items = [];
    theFeed.feed.entry.forEach(function (item: any) {
      // console.log(item);

      // Bail-out conditions
      //-------------------
      // Item id/guid missing
      if (typeof item.id === "undefined" || item.id == "") {
        return;
      }
      // No enclosures
      const enclosures = findAtomItemEnclosures(item);
      if (!Array.isArray(enclosures) || enclosures.length === 0) {
        return;
      }

      // Set up the preliminary feed object properties
      feedObj.items[i] = {
        title: item.title,
        link: "",
        itunesEpisode: item["itunes:episode"],
        itunesEpisodeType: item["itunes:episodeType"],
        itunesExplicit: 0,
        enclosure: enclosures[0],
        pubDate: pubDateToTimestamp(item.updated),
        guid: item.id,
        description: item.content,
        image: feedObj.image,
      };

      // Item title
      if (Array.isArray(feedObj.items[i].title)) {
        feedObj.items[i].title = feedObj.items[i].title[0];
      }
      if (
        typeof feedObj.items[i].title === "object" &&
        typeof feedObj.items[i].title["#text"] !== "undefined"
      ) {
        feedObj.items[i].title = feedObj.items[i].title["#text"];
      }
      if (typeof feedObj.items[i].title !== "string") {
        feedObj.items[i].title = "";
      }
      if (typeof item["itunes:title"] === "string" && item["itunes:title"] != "") {
        feedObj.items[i].title = item["itunes:title"];
      }
      feedObj.items[i].title = feedObj.items[i].title.trim();

      // Item link
      const itemLinks = findAtomItemAlternateLinks(item);
      if (itemLinks && itemLinks.length > 0) {
        feedObj.items[i].link = itemLinks[0];
      }

      // Item description
      if (typeof item["itunes:summary"] === "string" && item["itunes:summary"] != "") {
        feedObj.items[i].description = item["itunes:summary"];
      }
      if (typeof item.description !== "undefined" && item.description != "") {
        if (typeof item.description["content:encoded"] === "string") {
          feedObj.items[i].description = item.description["content:encoded"];
        } else {
          feedObj.items[i].description = item.description;
        }
      }
      if (Array.isArray(item.content)) {
        item.content = item.content[0];
      }
      if (typeof item.content === "object" && typeof item.content["#text"] === "string") {
        feedObj.items[i].description = item.content["#text"];
      }
      if (typeof feedObj.items[i].description === "string") {
        feedObj.items[i].description = feedObj.items[i].description.trim();
      } else {
        feedObj.items[i].description = "";
      }

      // Itunes specific stuff
      if (
        typeof item["itunes:explicit"] === "string" &&
        (item["itunes:explicit"].toLowerCase() == "yes" ||
          item["itunes:explicit"].toLowerCase() == "true")
      ) {
        feedObj.items[i].itunesExplicit = 1;
      }
      if (typeof item["itunes:explicit"] === "boolean" && item["itunes:explicit"]) {
        feedObj.items[i].itunesExplicit = 1;
      }
      if (
        typeof item["itunes:duration"] !== "undefined" &&
        typeof item["itunes:duration"] === "string"
      ) {
        feedObj.items[i].itunesDuration = timeToSeconds(item["itunes:duration"]);
        if (isNaN(feedObj.items[i].itunesDuration)) {
          feedObj.items[i].itunesDuration = 0;
        }
      } else {
        feedObj.items[i].itunesDuration = 0;
      }
      if (typeof feedObj.items[i].itunesEpisode === "string") {
        feedObj.items[i].itunesEpisode = feedObj.items[i].itunesEpisode.replace(/\D/g, "");
        if (feedObj.items[i].itunesEpisode != "") {
          feedObj.items[i].itunesEpisode = parseInt(feedObj.items[i].itunesEpisode);
        }
      }
      if (typeof feedObj.items[i].itunesEpisode !== "number") {
        delete feedObj.items[i].itunesEpisode;
      }

      i++;
    });

    // Get the pubdate of the most recent item
    let mostRecentPubDate = 0;
    feedObj.items.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.updated);
      if (thisPubDate > mostRecentPubDate && thisPubDate <= timeStarted) {
        mostRecentPubDate = thisPubDate;
      }
    });
    feedObj.newestItemPubDate = mostRecentPubDate;

    // Get the pubdate of the oldest item
    let oldestPubDate = mostRecentPubDate;
    feedObj.items.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.updated);
      if (thisPubDate < oldestPubDate && thisPubDate > 0) {
        oldestPubDate = thisPubDate;
      }
    });
    feedObj.oldestItemPubDate = oldestPubDate;
  }

  // Make sure we have a valid pubdate if possible
  if (typeof feedObj.pubDate === "undefined") {
    if (typeof feedObj.lastBuildDate !== "undefined") {
      feedObj.pubDate = feedObj.lastBuildDate;
    } else {
      feedObj.pubDate = 0;
    }
  }
  if (typeof feedObj.pubDate === "string") {
    feedObj.pubDate = pubDateToTimestamp(feedObj.pubDate);
  }

  return feedObj;
}

// Parse out all of the links from an atom entry and see which ones are enclosures
function findAtomItemEnclosures(entry: any) {
  const enclosures: any[] = [];

  // Multiple link objects in an array?
  if (Array.isArray(entry.link)) {
    entry.link.forEach(function (item: any) {
      const enclosure: any = {};

      // console.log(item);
      if (typeof item.attr !== "object") return;

      if (typeof item.attr["@_rel"] === "string") {
        if (item.attr["@_rel"] !== "enclosure") return;

        // Set the url
        if (typeof item.attr["@_href"] !== "string") return;
        if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;
        enclosure.url = item.attr["@_href"];

        // Set the length
        enclosure.length = 0;
        if (typeof item.attr["@_length"] === "string") {
          enclosure.length = parseInt(item.attr["@_length"]);
        }
        if (typeof item.attr["@_length"] === "number") {
          enclosure.length = item.attr["@_length"];
        }
        if (isNaN(enclosure.length) || typeof enclosure.length === "undefined") {
          enclosure.length = 0;
        }

        // Set the type
        enclosure.type = "";
        if (typeof item.attr["@_type"] === "string") {
          enclosure.type = item.attr["@_type"];
        }
        if (typeof enclosure.type === "undefined" || enclosure.type === "") {
          enclosure.type = guessEnclosureType(enclosure.url);
        }

        // We have a valid enclosure at this point, so push onto the array
        enclosures.push(enclosure);
      }
    });

    return enclosures;
  }

  // Just a straight object
  if (typeof entry.link === "object") {
    const item = entry.link;
    const enclosure: any = {};

    // console.log(item);

    if (item.attr["@_rel"] !== "enclosure") return;

    // Set the url
    if (typeof item.attr["@_href"] !== "string") return;
    if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;
    enclosure.url = item.attr["@_href"];

    // Set the length
    enclosure.length = 0;
    if (typeof item.attr["@_length"] === "string") {
      enclosure.length = parseInt(item.attr["@_length"]);
    }
    if (typeof item.attr["@_length"] === "number") {
      enclosure.length = item.attr["@_length"];
    }
    if (isNaN(enclosure.length) || typeof enclosure.length === "undefined") {
      enclosure.length = 0;
    }

    // Set the type
    enclosure.type = "";
    if (typeof item.attr["@_type"] === "string") {
      enclosure.type = item.attr["@_type"];
    }
    if (typeof enclosure.type === "undefined" || enclosure.type === "") {
      enclosure.type = guessEnclosureType(enclosure.url);
    }

    // We have a valid enclosure at this point, so push onto the array
    enclosures.push(enclosure);
  }

  return enclosures;
}

// Parse out all of the links from an atom entry and see which ones are alternates
function findAtomItemAlternateLinks(entry: any) {
  const alternates: string[] = [];

  // Multiple link objects in an array?
  if (Array.isArray(entry.link)) {
    entry.link.forEach(function (item: any) {
      // console.log(item);
      if (typeof item.attr !== "object") return;

      if (typeof item.attr["@_rel"] === "string") {
        if (item.attr["@_rel"] !== "alternate") return;

        // Set the url
        if (typeof item.attr["@_href"] !== "string") return;
        if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

        // Push this url on the array
        alternates.push(item.attr["@_href"]);
      }
    });

    return alternates;
  }

  // Just a straight object
  if (typeof entry.link === "object") {
    const item = entry.link;

    // console.log(item);
    if (typeof item.attr !== "object") return;

    if (typeof item.attr["@_rel"] === "string") {
      if (item.attr["@_rel"] !== "alternate") return;

      // Set the url
      if (typeof item.attr["@_href"] !== "string") return;
      if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return;

      // Push this url on the array
      alternates.push(item.attr["@_href"]);
    }
  }

  return alternates;
}
