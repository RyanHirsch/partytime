/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import parser from "fast-xml-parser";
import he from "he";
import crypto from "crypto";

import { log } from "./shared";
import { parseRss } from "./rss";
import { parseAtom } from "./atom";

// interface Feed {
// id: feed.id;
// itunesId: feed.itunes_id;
// url: feed.url;
// contentLength: feed.content.length;
// type: 0;
// language: "en";
// lastItemUpdateTime: feed.newest_item_pubdate;
// newestItemPubDate: 0;
// oldestItemPubDate: 0;
// itemCount: 0;
// updateFrequency: feed.update_frequency;
// itemUrlStrings: "";
// chash: "";
// pubsub: false;
// podcastChapters: "";
// podcastLocked: 0;
// podcastOwner: feed.podcast_owner;
// }

const parserOptions = {
  attributeNamePrefix: "@_",
  attrNodeName: "attr", // default is 'false'
  textNodeName: "#text",
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  // cdataTagName: "__cdata", //default is 'false'
  // cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, // "strict"
  tagValueProcessor: (val: string) => he.decode(val), // default is a=>a
  stopNodes: ["parse-me-as-string"],
};

export function parseFeed(xml: string) {
  const parsedContent = parser.validate(xml.trim());
  if (parsedContent === true) {
    return handleValidFeed(xml);
  }
  return handleInvalidFeed(xml);
}

function handleValidFeed(xml: string) {
  const theFeed = parser.parse(xml.trim(), parserOptions);
  let feedObj: any;
  if (typeof theFeed.rss === "object") {
    feedObj = parseRss(theFeed);
  } else if (typeof theFeed.feed === "object") {
    feedObj = parseAtom(theFeed);
  } else {
    // Unsupported
    return null;
  }

  if (!feedObj) {
    console.log("Parsing failed...");
    return null;
  }

  const feedHash = crypto
    .createHash("md5")
    .update(
      feedObj.title +
        feedObj.link +
        feedObj.language +
        feedObj.generator +
        feedObj.itunesAuthor +
        feedObj.itunesOwnerName +
        feedObj.itunesOwnerEmail +
        feedObj.itemUrlStrings
    )
    .digest("hex");

  log(feedHash);
  return feedObj;
}

function handleInvalidFeed(xml: string) {
  log("invalid feed");
  log(xml);
  return null;
}
