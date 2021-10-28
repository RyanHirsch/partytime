/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import crypto from "crypto";

import { logger } from "../logger";

import { unifiedParser } from "./unified";
import { parse, validate } from "./xml-parser";
import { FeedObject, FeedType } from "./types";

export function parseFeed(xml: string): FeedObject | null {
  const parsedContent = validate(xml.trim());
  if (parsedContent === true) {
    return handleValidFeed(xml);
  }
  return handleInvalidFeed(xml);
}

function handleValidFeed(xml: string): FeedObject | null {
  const theFeed = parse(xml.trim());
  let feedObj: FeedObject | null;
  if (typeof theFeed.rss === "object") {
    feedObj = unifiedParser(theFeed, FeedType.RSS);
  } else if (typeof theFeed.feed === "object") {
    feedObj = unifiedParser(theFeed, FeedType.ATOM);
  } else {
    // Unsupported
    return null;
  }

  if (!feedObj) {
    logger.error("Parsing failed...");
    return null;
  }

  const feedHash = crypto
    .createHash("md5")
    .update(
      feedObj.title +
        feedObj.link +
        feedObj.language +
        feedObj.generator +
        (feedObj.author ?? "") +
        (feedObj.owner?.name ?? "") +
        (feedObj.owner?.email ?? "")
    )
    .digest("hex");

  logger.debug(" - ", feedHash);
  return feedObj;
}

function handleInvalidFeed(xml: string) {
  logger.warn("invalid feed");
  logger.warn(xml);
  return null;
}
