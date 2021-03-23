/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import crypto from "crypto";

import { log } from "../logger";
import { parseRss } from "./rss";
import { parseAtom } from "./atom";
import { parse, validate } from "./xml-parser";

export function parseFeed(xml: string) {
  const parsedContent = validate(xml.trim());
  if (parsedContent === true) {
    return handleValidFeed(xml);
  }
  return handleInvalidFeed(xml);
}

function handleValidFeed(xml: string) {
  const theFeed = parse(xml.trim());
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
    log.error("Parsing failed...");
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

  log.info(" - ", feedHash);
  return feedObj;
}

function handleInvalidFeed(xml: string) {
  log.warn("invalid feed");
  log.warn(xml);
  return null;
}
