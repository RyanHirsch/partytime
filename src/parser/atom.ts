/* eslint-disable prefer-destructuring */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Episode,
  FeedObject,
  FeedType,
  findPubSubLinks,
  guessEnclosureType,
  notUndefined,
  pubDateToTimestamp,
  timeToSeconds,
} from "./shared";

export function parseAtom(theFeed: any) {
  const timeStarted = Math.floor(Date.now() / 1000);

  const feedObj: Partial<FeedObject> = {
    type: FeedType.ATOM,
    title: theFeed.feed.title,
    link: theFeed.feed.link,
    description: theFeed.feed.subtitle,
    language: theFeed.feed.language,
    generator: theFeed.feed.generator,
    pubDate: theFeed.feed.updated,
    lastBuildDate: theFeed.feed.updated,
    itunesType: theFeed.feed["itunes:type"],
    itunesCategory: theFeed.feed["itunes:category"],
    itunesNewFeedUrl: theFeed.feed["itunes:new-feed-url"],
    pubsub: findPubSubLinks(theFeed.feed),
    items: [],
  };

  // Key attributes

  if (typeof theFeed.feed.author === "object" && typeof theFeed.feed.author.name === "string") {
    feedObj.itunesAuthor = theFeed.feed.author.name;
    feedObj.itunesOwnerName = theFeed.feed.author.name;
  }
  if (typeof theFeed.feed.author === "object" && typeof theFeed.feed.author.email === "string") {
    feedObj.itunesOwnerEmail = theFeed.feed.author.email;
  }

  // Feed title
  if (Array.isArray(theFeed.feed.title)) {
    feedObj.title = theFeed.feed.title[0];
  }
  if (typeof theFeed.title === "object" && typeof theFeed.title["#text"] === "string") {
    feedObj.title = theFeed.title["#text"];
  }
  if (typeof feedObj.title !== "string") {
    feedObj.title = "";
  }

  // Feed description
  if (Array.isArray(theFeed.description)) {
    feedObj.description = theFeed.description[0];
  }
  if (typeof theFeed.description === "object") {
    if (typeof theFeed.description["#text"] === "string") {
      feedObj.description = theFeed.description["#text"];
    }
    if (typeof theFeed.description["#html"] === "string") {
      feedObj.description = theFeed.description["#text"];
    }
  }
  if (typeof theFeed.description !== "string") {
    feedObj.description = "";
  }

  // Feed link
  if (Array.isArray(theFeed.feed.link)) {
    feedObj.link = theFeed.feed.link[0];
  }
  if (typeof theFeed.link === "object") {
    if (typeof theFeed.link["#text"] !== "undefined") {
      feedObj.link = theFeed.link["#text"];
    } else if (typeof theFeed.link.attr["@_href"] !== "undefined") {
      feedObj.link = theFeed.link.attr["@_href"];
    } else if (typeof theFeed.url !== "undefined" && theFeed.url === "string") {
      feedObj.link = theFeed.url;
    }
  }
  if (typeof theFeed.link !== "string") {
    feedObj.link = "";
  }

  // Feed generator
  if (Array.isArray(theFeed.feed.generator)) {
    feedObj.generator = theFeed.feed.generator[0];
  }
  if (typeof theFeed.generator === "object" && typeof theFeed.generator["#text"] !== "undefined") {
    feedObj.generator = theFeed.generator["#text"];
  }

  if (typeof feedObj.generator !== "string") {
    feedObj.generator = "";
  }

  // Feed explicit content
  feedObj.explicit = 0;
  if (
    typeof theFeed.feed["itunes:explicit"] === "string" &&
    (theFeed.feed["itunes:explicit"].toLowerCase() === "yes" ||
      theFeed.feed["itunes:explicit"].toLowerCase() === "true")
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
    typeof theFeed.image === "undefined" &&
    typeof theFeed.itunesImage !== "undefined" &&
    theFeed.itunesImage
  ) {
    feedObj.image = theFeed.itunesImage;
  }

  //------------------------------------------------------------------------
  // Are there even any items to get
  if (typeof theFeed.feed.entry !== "undefined") {
    // Items
    feedObj.items = getEntryItems(theFeed)
      .map((item: any): Episode | undefined => {
        // console.log(item);

        // Bail-out conditions
        //-------------------
        // Item id/guid missing
        if (typeof item.id === "undefined" || !item.id) {
          return undefined;
        }
        // No enclosures
        const enclosures = findAtomItemEnclosures(item);
        if (!Array.isArray(enclosures) || enclosures.length === 0) {
          return undefined;
        }

        // Set up the preliminary feed object properties
        const newFeedItem: Episode = {
          title: item.title,
          link: "",
          itunesEpisodeType: item["itunes:episodeType"],
          itunesExplicit: 0,
          itunesDuration: 0,
          itunesSeason: null,
          itunesEpisode: 0,
          itunesImage: "",
          enclosure: enclosures[0],
          pubDate: pubDateToTimestamp(item.updated),
          guid: item.id,
          description: "",
          image: feedObj.image ?? "",
        };

        // Item title
        if (Array.isArray(item.title)) {
          newFeedItem.title = item.title[0];
        }
        if (typeof item.title === "object" && typeof item.title["#text"] !== "undefined") {
          newFeedItem.title = item.title["#text"];
        }
        if (typeof item.title !== "string") {
          newFeedItem.title = "";
        }
        if (typeof item["itunes:title"] === "string" && item["itunes:title"]) {
          newFeedItem.title = item["itunes:title"];
        }
        newFeedItem.title = item.title.trim();

        // Item link
        const itemLinks = findAtomItemAlternateLinks(item);
        if (itemLinks && itemLinks.length > 0) {
          newFeedItem.link = itemLinks[0];
        }

        // Item description
        if (typeof item["itunes:summary"] === "string" && item["itunes:summary"]) {
          newFeedItem.description = item["itunes:summary"];
        }
        if (typeof item.description !== "undefined" && item.description) {
          if (typeof item.description["content:encoded"] === "string") {
            newFeedItem.description = item.description["content:encoded"];
          } else {
            newFeedItem.description = item.description;
          }
        }

        if (typeof item.description === "string") {
          newFeedItem.description = item.description.trim();
        } else {
          const content = Array.isArray(item.content) ? item.content[0] : item.content;
          if (typeof content === "object" && typeof content["#text"] === "string") {
            newFeedItem.description = content["#text"];
          }
        }

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
        if (
          typeof item["itunes:duration"] !== "undefined" &&
          typeof item["itunes:duration"] === "string"
        ) {
          newFeedItem.itunesDuration = timeToSeconds(item["itunes:duration"]);
          if (Number.isNaN(newFeedItem.itunesDuration)) {
            newFeedItem.itunesDuration = 0;
          }
        }

        if (typeof item["itunes:episode"] === "string") {
          const parsedEpisodeString = item["itunes:episode"].replace(/\D/g, "");
          if (parsedEpisodeString) {
            newFeedItem.itunesEpisode = parseInt(parsedEpisodeString, 10);
          }
        }
        return newFeedItem;
      })
      .filter(notUndefined);

    // Get the pubdate of the most recent item
    let mostRecentPubDate = 0;
    feedObj.items.forEach((item: any) => {
      const thisPubDate = pubDateToTimestamp(item.updated);
      if (thisPubDate > mostRecentPubDate && thisPubDate <= timeStarted) {
        mostRecentPubDate = thisPubDate;
      }
    });
    feedObj.newestItemPubDate = mostRecentPubDate;

    // Get the pubdate of the oldest item
    let oldestPubDate = mostRecentPubDate;
    feedObj.items.forEach((item: any) => {
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

function getEntryItems(theFeed: any): any[] {
  if (!Array.isArray(theFeed.feed.entry)) {
    return [theFeed.feed.entry];
  }
  return theFeed.feeed.entry;
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
          enclosure.length = parseInt(item.attr["@_length"], 10);
        }
        if (typeof item.attr["@_length"] === "number") {
          enclosure.length = item.attr["@_length"];
        }
        if (Number.isNaN(enclosure.length) || typeof enclosure.length === "undefined") {
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

    if (item.attr["@_rel"] !== "enclosure") return [];

    // Set the url
    if (typeof item.attr["@_href"] !== "string") return [];
    if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return [];
    enclosure.url = item.attr["@_href"];

    // Set the length
    enclosure.length = 0;
    if (typeof item.attr["@_length"] === "string") {
      enclosure.length = parseInt(item.attr["@_length"], 10);
    }
    if (typeof item.attr["@_length"] === "number") {
      enclosure.length = item.attr["@_length"];
    }
    if (Number.isNaN(enclosure.length) || typeof enclosure.length === "undefined") {
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
    if (typeof item.attr !== "object") return [];

    if (typeof item.attr["@_rel"] === "string") {
      if (item.attr["@_rel"] !== "alternate") return [];

      // Set the url
      if (typeof item.attr["@_href"] !== "string") return [];
      if (typeof item.attr["@_href"] === "string" && item.attr["@_href"] === "") return [];

      // Push this url on the array
      alternates.push(item.attr["@_href"]);
    }
  }

  return alternates;
}
