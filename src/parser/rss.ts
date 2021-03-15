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

import {
  FeedType,
  findPubSubLinks,
  guessEnclosureType,
  pubDateToTimestamp,
  sanitizeUrl,
  timeToSeconds,
  twoDotOhCompliant,
} from "./shared";

export function parseRss(theFeed: any) {
  const timeStarted = Math.floor(Date.now() / 1000);

  const feedObj: any = {};
  feedObj.type = FeedType.RSS;

  if (typeof theFeed.rss.channel === "undefined") {
    return null;
  }

  // Key attributes
  feedObj.title = theFeed.rss.channel.title;
  feedObj.link = theFeed.rss.channel.link;
  feedObj.language = theFeed.rss.channel.language;
  feedObj.generator = theFeed.rss.channel.generator;
  feedObj.pubDate = theFeed.rss.channel.pubDate;
  feedObj.lastBuildDate = theFeed.rss.channel.lastBuildDate;
  feedObj.itunesType = theFeed.rss.channel["itunes:type"];
  feedObj.itunesCategory = theFeed.rss.channel["itunes:category"];
  feedObj.itunesNewFeedUrl = theFeed.rss.channel["itunes:new-feed-url"];
  feedObj.categories = [];
  feedObj.value = {};

  // Pubsub links?
  feedObj.pubsub = findPubSubLinks(theFeed.rss.channel);

  // Clean the title
  if (typeof feedObj.title === "string") {
    feedObj.title = feedObj.title.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Clean the link
  if (typeof feedObj.link === "string") {
    feedObj.link = feedObj.link.trim().replace(/(\r\n|\n|\r)/gm, "");
  }

  // Feed categories
  if (Array.isArray(feedObj.itunesCategory)) {
    feedObj.itunesCategory.forEach(function (item: any) {
      if (
        typeof item === "object" &&
        typeof item.attr !== "undefined" &&
        typeof item.attr["@_text"] === "string"
      ) {
        feedObj.categories.push(
          item.attr["@_text"].toLowerCase().replace("&amp;", "").split(/[ ]+/)
        );

        // Check for sub-items
        if (
          typeof item["itunes:category"] === "object" &&
          typeof item["itunes:category"].attr !== "undefined" &&
          typeof item["itunes:category"].attr["@_text"] === "string"
        ) {
          feedObj.categories.push(
            item["itunes:category"].attr["@_text"].toLowerCase().replace("&amp;", "").split(/[ ]+/)
          );
        }
      }
    });
  } else if (
    typeof feedObj.itunesCategory === "object" &&
    typeof feedObj.itunesCategory.attr !== "undefined" &&
    typeof feedObj.itunesCategory.attr["@_text"] === "string"
  ) {
    feedObj.categories.push(
      feedObj.itunesCategory.attr["@_text"].toLowerCase().replace("&amp;", "").split(/[ ]+/)
    );

    // Check for sub-items
    if (
      typeof feedObj.itunesCategory["itunes:category"] === "object" &&
      typeof feedObj.itunesCategory["itunes:category"].attr !== "undefined" &&
      typeof feedObj.itunesCategory["itunes:category"].attr["@_text"] === "string"
    ) {
      feedObj.categories.push(
        feedObj.itunesCategory["itunes:category"].attr["@_text"]
          .toLowerCase()
          .replace("&amp;", "")
          .split(/[ ]+/)
      );
    }
  }
  feedObj.categories = [...new Set(feedObj.categories.flat(9))];

  // Feed owner/author
  if (typeof theFeed.rss.channel["itunes:author"] !== "undefined") {
    feedObj.itunesAuthor = theFeed.rss.channel["itunes:author"];
    if (Array.isArray(feedObj.itunesAuthor)) {
      feedObj.itunesAuthor = feedObj.itunesAuthor[0];
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

  // Duplicate pubdate?
  if (Array.isArray(feedObj.pubDate)) {
    feedObj.pubDate = feedObj.pubDate[0];
  }

  // Duplicate language?
  if (Array.isArray(feedObj.language)) {
    feedObj.language = feedObj.language[0];
  }

  // Itunes specific stuff
  if (Array.isArray(feedObj.itunesType)) {
    feedObj.itunesType = feedObj.itunesType[0];
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
    feedObj.itunesNewFeedUrl = feedObj.itunesNewFeedUrl[0];
  }

  // Feed generator
  if (Array.isArray(feedObj.generator)) {
    feedObj.generator = feedObj.generator[0];
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
    theFeed.rss.channel["itunes:explicit"] = theFeed.rss.channel["itunes:explicit"][0];
  }
  if (
    typeof theFeed.rss.channel["itunes:explicit"] === "string" &&
    (theFeed.rss.channel["itunes:explicit"].toLowerCase() == "yes" ||
      theFeed.rss.channel["itunes:explicit"].toLowerCase() == "true")
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
    theFeed.rss.channel["itunes:summary"] != ""
  ) {
    feedObj.description = theFeed.rss.channel["itunes:summary"];
    if (Array.isArray(theFeed.rss.channel["itunes:summary"])) {
      feedObj.description = theFeed.rss.channel["itunes:summary"][0];
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
  if (Array.isArray(theFeed.rss.channel.link)) {
    feedObj.link = theFeed.rss.channel.link[0];
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

  // #region Phase 1

  // Locked?
  if (typeof theFeed.rss.channel["podcast:locked"] === "object") {
    twoDotOhCompliant(feedObj, 1, "locked");

    if (
      theFeed.rss.channel["podcast:locked"]["#text"].trim().toLowerCase() === "yes" ||
      theFeed.rss.channel["podcast:locked"]["#text"].trim().toLowerCase() === "true"
    ) {
      feedObj.podcastLocked = 1;
    }
    if (
      typeof theFeed.rss.channel["podcast:locked"].attr["@_owner"] === "string" &&
      theFeed.rss.channel["podcast:locked"].attr["@_owner"] !== ""
    ) {
      feedObj.podcastOwner = theFeed.rss.channel["podcast:locked"].attr["@_owner"];
    }
    if (
      typeof theFeed.rss.channel["podcast:locked"].attr["@_email"] === "string" &&
      theFeed.rss.channel["podcast:locked"].attr["@_email"] !== ""
    ) {
      feedObj.podcastOwner = theFeed.rss.channel["podcast:locked"].attr["@_email"];
    }

    const lockLog = `${feedObj.podcastOwner}[${feedObj.podcastLocked}] - ${feedObj.url}`;

    console.log("\x1b[33m%s\x1b[0m", `LOCKED: ${lockLog}`);
  }

  // Funding
  if (typeof theFeed.rss.channel["podcast:funding"] === "object") {
    twoDotOhCompliant(feedObj, 1, "funding");

    let fundingMessage = "";
    if (
      typeof theFeed.rss.channel["podcast:funding"]["#text"] === "string" &&
      theFeed.rss.channel["podcast:funding"]["#text"] !== ""
    ) {
      fundingMessage = theFeed.rss.channel["podcast:funding"]["#text"];
    }
    if (
      typeof theFeed.rss.channel["podcast:funding"].attr["@_url"] === "string" &&
      theFeed.rss.channel["podcast:funding"].attr["@_url"] !== ""
    ) {
      feedObj.podcastFunding = {
        message: fundingMessage,
        url: theFeed.rss.channel["podcast:funding"].attr["@_url"],
      };
    }

    // console.log(feedObj.podcastFunding);
  }

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
      theFeed.rss.channel.item = newItem;
    }

    // Items
    let i = 0;
    feedObj.items = [];
    theFeed.rss.channel.item.forEach(function (item: any) {
      // console.log(item);
      let itemguid = "";

      // If there is no enclosure, just skip this item and move on to the next
      if (typeof item.enclosure !== "object") {
        return;
      }

      // If there is more than one enclosure in the item, just get the first one
      if (Array.isArray(item.enclosure)) {
        item.enclosure = item.enclosure[0];
      }

      // If there is no guid in the item, then skip this item and move on
      if (typeof item.guid !== "undefined") {
        itemguid = item.guid;
        if (typeof item.guid["#text"] === "string") {
          itemguid = item.guid["#text"];
        }
      }
      if (typeof itemguid !== "string" || itemguid === "") {
        return;
      }

      feedObj.items[i] = {
        title: item.title,
        link: item.link,
        itunesEpisode: item["itunes:episode"],
        itunesEpisodeType: item["itunes:episodeType"],
        itunesSeason: item["itunes:season"],
        itunesExplicit: 0,
        enclosure: {
          url: item.enclosure.attr["@_url"],
          length: parseInt(item.enclosure.attr["@_length"]),
          type: item.enclosure.attr["@_type"],
        },
        pubDate: pubDateToTimestamp(item.pubDate),
        guid: itemguid,
        description: "",
      };

      // Item title
      if (typeof feedObj.items[i].title === "string") {
        feedObj.items[i].title = feedObj.items[i].title.trim();
      } else {
        feedObj.items[i].title = "";
      }
      if (typeof item["itunes:title"] !== "undefined" && item["itunes:title"] != "") {
        feedObj.items[i].title = item["itunes:title"];
      }

      // Item link
      if (typeof feedObj.items[i].link === "object") {
        if (typeof feedObj.items[i].link["#text"] === "string") {
          feedObj.items[i].link = feedObj.items[i].link["#text"];
        }
        if (
          typeof feedObj.items[i].link.attr !== "undefined" &&
          (typeof feedObj.items[i].link.attr["@_href"] === "string" ||
            feedObj.items[i].link.attr["@_href"] !== "")
        ) {
          feedObj.items[i].link = feedObj.items[i].link.attr["@_href"];
        }
      }
      if (typeof feedObj.items[i].link !== "string") {
        feedObj.items[i].link = "";
      }

      // Item image
      feedObj.items[i].itunesImage = "";
      if (typeof item["itunes:image"] === "object") {
        if (typeof item["itunes:image"].url === "string") {
          feedObj.items[i].itunesImage = item["itunes:image"].url;
        }
        if (
          typeof item["itunes:image"].attr !== "undefined" &&
          typeof item["itunes:image"].attr["@_href"] === "string"
        ) {
          feedObj.items[i].itunesImage = item["itunes:image"].attr["@_href"];
        }
      }
      if (typeof item["itunes:image"] === "string") {
        feedObj.items[i].itunesImage = item["itunes:image"];
      }
      feedObj.items[i].itunesImage = sanitizeUrl(feedObj.items[i].itunesImage);
      feedObj.items[i].image = "";
      if (typeof item.image !== "undefined" && typeof item.image.url === "string") {
        feedObj.items[i].image = item.image.url;
      }
      if (feedObj.items[i].image === "" && feedObj.items[i].itunesImage !== "") {
        feedObj.items[i].image = feedObj.items[i].itunesImage;
      }
      feedObj.items[i].image = sanitizeUrl(feedObj.items[i].image);

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
      if (typeof item["itunes:duration"] !== "undefined") {
        if (typeof item["itunes:duration"] === "string") {
          feedObj.items[i].itunesDuration = timeToSeconds(item["itunes:duration"]);
          if (isNaN(feedObj.items[i].itunesDuration)) {
            feedObj.items[i].itunesDuration = 0;
          }
        } else if (typeof item["itunes:duration"] === "number") {
          feedObj.items[i].itunesDuration = item["itunes:duration"];
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
      if (Array.isArray(feedObj.items[i].itunesEpisodeType)) {
        feedObj.items[i].itunesEpisodeType = feedObj.items[i].itunesEpisodeType[0];
      }
      if (
        typeof feedObj.items[i].itunesEpisodeType === "object" &&
        typeof feedObj.items[i].itunesEpisodeType["#text"] === "string"
      ) {
        feedObj.items[i].itunesEpisodeType = feedObj.items[i].itunesEpisodeType["#text"];
      }
      if (Array.isArray(feedObj.items[i].itunesSeason)) {
        feedObj.items[i].itunesSeason = feedObj.items[i].itunesSeason[0];
      }
      if (
        typeof feedObj.items[i].itunesSeason === "object" &&
        typeof feedObj.items[i].itunesSeason["#text"] === "string"
      ) {
        feedObj.items[i].itunesSeason = feedObj.items[i].itunesSeason["#text"];
      }

      // Item description
      if (typeof item["itunes:summary"] !== "undefined" && item["itunes:summary"] != "") {
        feedObj.items[i].description = item["itunes:summary"];
      }
      if (typeof item.description !== "undefined" && item.description != "") {
        if (typeof item.description["content:encoded"] !== "undefined") {
          feedObj.items[i].description = item.description["content:encoded"];
        } else {
          feedObj.items[i].description = item.description;
        }
      }
      if (typeof feedObj.items[i].description === "string") {
        feedObj.items[i].description = feedObj.items[i].description.trim();
      } else {
        feedObj.items[i].description = "";
      }

      // Enclosure
      if (isNaN(feedObj.items[i].enclosure.length)) {
        feedObj.items[i].enclosure.length = 0;
      }
      if (
        typeof feedObj.items[i].enclosure.type === "undefined" ||
        feedObj.items[i].enclosure.type === null ||
        feedObj.items[i].enclosure.type === ""
      ) {
        feedObj.items[i].enclosure.type = guessEnclosureType(feedObj.items[i].enclosure.url);
      }

      // Transcripts Phase 1
      if (Array.isArray(item["podcast:transcript"])) {
        item["podcast:transcript"] = item["podcast:transcript"][0];
      }
      if (
        typeof item["podcast:transcript"] !== "undefined" &&
        typeof item["podcast:transcript"].attr === "object" &&
        typeof item["podcast:transcript"].attr["@_url"] === "string"
      ) {
        twoDotOhCompliant(feedObj, 1, "transcript");

        feedObj.items[i].podcastTranscripts = {
          url: item["podcast:transcript"].attr["@_url"],
          type: 0,
        };
      }

      // Chapters Phase 1
      if (
        typeof item["podcast:chapters"] !== "undefined" &&
        typeof item["podcast:chapters"].attr === "object" &&
        typeof item["podcast:chapters"].attr["@_url"] === "string"
      ) {
        twoDotOhCompliant(feedObj, 1, "chapters");

        feedObj.items[i].podcastChapters = {
          url: item["podcast:chapters"].attr["@_url"],
          type: 0,
        };
      }

      // Soundbites
      if (Array.isArray(item["podcast:soundbite"])) {
        twoDotOhCompliant(feedObj, 1, "soundbites");

        feedObj.items[i].podcastSoundbites = [];
        item["podcast:soundbite"].forEach(function (soundbite: any) {
          if (
            typeof soundbite !== "undefined" &&
            typeof soundbite.attr === "object" &&
            typeof soundbite.attr["@_startTime"] !== "undefined" &&
            typeof soundbite.attr["@_duration"] !== "undefined"
          ) {
            feedObj.items[i].podcastSoundbites.push({
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

        feedObj.items[i].podcastSoundbites = {
          startTime: item["podcast:soundbite"].attr["@_startTime"],
          duration: item["podcast:soundbite"].attr["@_duration"],
          title: item["podcast:soundbite"]["#text"],
        };
        // console.log(item["podcast:soundbite"]);
        // console.log(feedObj.items[i].podcastSoundbites);
      }

      i++;
    });

    // Get the pubdate of the most recent item
    let mostRecentPubDate = 0;
    feedObj.items.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.pubDate);
      if (thisPubDate > mostRecentPubDate && thisPubDate <= timeStarted) {
        mostRecentPubDate = thisPubDate;
      }
      // console.log(item.pubDate + ": " + pubDateToTimestamp(item.pubDate));
    });
    feedObj.newestItemPubDate = mostRecentPubDate;

    // Get the pubdate of the oldest item
    let oldestPubDate = mostRecentPubDate;
    feedObj.items.forEach(function (item: any) {
      const thisPubDate = pubDateToTimestamp(item.pubDate);
      if (thisPubDate < oldestPubDate && thisPubDate > 0) {
        oldestPubDate = thisPubDate;
      }
      // console.log(item.pubDate + ": " + pubDateToTimestamp(item.pubDate));
    });
    feedObj.oldestItemPubDate = oldestPubDate;
  }

  console.log(`PubDate: ${feedObj.pubDate}`);

  // Make sure we have a valid pubdate if possible
  if (feedObj.pubDate == "" || feedObj.pubDate == 0 || isNaN(feedObj.pubDate)) {
    if (typeof feedObj.lastBuildDate !== "string") {
      feedObj.pubDate = 0;
    } else {
      feedObj.pubDate = feedObj.lastBuildDate;
    }
  }
  if (typeof feedObj.pubDate === "string") {
    feedObj.pubDate = pubDateToTimestamp(feedObj.pubDate);
  }
  if (
    typeof feedObj.newestItemPubDate === "number" &&
    (typeof feedObj.pubDate !== "number" || feedObj.pubDate == 0)
  ) {
    feedObj.pubDate = feedObj.newestItemPubDate;
  }

  return feedObj;
}
