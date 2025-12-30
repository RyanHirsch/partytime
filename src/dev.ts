/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

import fetch from "node-fetch";

import { logger } from "./logger";
import { parseFeed, FeedObject } from "./parser";
import { getFeedText } from "./shared";

const feeds: Array<{ name: string; url: string }> = [
  { name: "Podcasting 2.0", url: "http://mp3s.nashownotes.com/pc20rss.xml" },
  // { name: "Golden Nuggets", url: "https://feeds.buzzsprout.com/1293872.rss" },
  // { name: "PodClock", url: "https://podnews.net/clock-rss" },
  // { name: "That's all I got", url: "https://kevinbae.com/feed/podcast" },
];

export async function checkAll(): Promise<void> {
  for (let i = 0; i < feeds.length; i += 1) {
    const { name, url } = feeds[i];
    logger.info(`Parsing ${name}: ${url}`);
    await getFeed(url, { save: false });
  }
}

interface GetFeedOptions {
  save?: boolean;
  verbose?: boolean;
}

const urlToFile: Array<{ uri: string; uriHash: string; title: string; parsed: string }> = [];

async function getFeed(uri: string, options: GetFeedOptions = {}): Promise<void> {
  const { save: shouldSave = false, verbose = true } = options;

  const xml = await getFeedText(uri);

  if (verbose) {
    console.log(`\n📡 Fetched ${xml.length} bytes from ${uri}\n`);
  }

  const feedObject = parseFeed(xml);
  if (!feedObject) {
    console.error(`❌ Failed to parse xml from ${uri}`);
    return;
  }

  if (verbose) {
    console.log(`✅ Successfully parsed feed: "${feedObject.title}"`);
    console.log(`   Episodes: ${feedObject.items?.length ?? 0}`);
    console.log(`   PC2.0 Support: ${JSON.stringify(feedObject.pc20support)}`);
    console.log("");
    console.log(JSON.stringify(feedObject, null, 2));
  }

  if (shouldSave) {
    saveFeedData(uri, xml, feedObject);
  }
}

function saveFeedData(uri: string, xml: string, feedObject: FeedObject): void {
  const uriHash = crypto.createHash("md5").update(uri).digest("hex");

  // Ensure directories exist
  const rawDir = path.resolve(__dirname, "../raw");
  const resultsDir = path.resolve(__dirname, "../results");

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save raw XML
  const xmlPath = path.resolve(rawDir, `${uriHash}.txt`);
  fs.writeFileSync(xmlPath, xml);
  logger.info(`Saved raw XML to ${xmlPath}`);

  // Save parsed JSON
  const parsedFilename = `${feedObject.title
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\W+/g, "-")}.json`;
  const parsedPath = path.resolve(resultsDir, parsedFilename);
  fs.writeFileSync(parsedPath, JSON.stringify({ ...feedObject, url: uri }, null, 2));
  logger.info(`Saved parsed feed to ${parsedPath}`);

  // Update list
  urlToFile.push({
    uri,
    uriHash,
    title: feedObject.title,
    parsed: parsedFilename,
  });
  const listPath = path.resolve(rawDir, "list.json");
  fs.writeFileSync(listPath, JSON.stringify(urlToFile, null, 2));
}

function printUsage(): void {
  console.log(`
Usage: yarn dev [options] [url]

Options:
  --latest        Fetch and parse latest feeds from Podcast Index API
                  (requires PI_API_KEY and PI_API_SECRET env vars)
  --save          Save raw XML and parsed JSON to disk
  --all           Parse all feeds in the predefined list
  <url>           Parse a specific feed URL

Examples:
  yarn dev http://mp3s.nashownotes.com/pc20rss.xml
  yarn dev --save http://mp3s.nashownotes.com/pc20rss.xml
  yarn dev --all
  yarn dev --latest
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return;
  }

  const shouldSave = args.includes("--save");
  const filteredArgs = args.filter((arg) => arg !== "--save");

  if (filteredArgs.includes("--latest")) {
    await runLatest(shouldSave);
  } else if (filteredArgs.includes("--all")) {
    for (const feed of feeds) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Parsing: ${feed.name}`);
      console.log(`${"=".repeat(60)}`);
      await getFeed(feed.url, { save: shouldSave });
    }
  } else if (filteredArgs.length > 0) {
    const url = filteredArgs.find((arg) => !arg.startsWith("--"));
    if (url) {
      await getFeed(url, { save: shouldSave });
    } else {
      printUsage();
    }
  } else {
    printUsage();
  }
}

async function runLatest(shouldSave: boolean): Promise<void> {
  const key = process.env.PI_API_KEY;
  const secret = process.env.PI_API_SECRET;

  if (!key || !secret) {
    console.error(
      "❌ PI_API_KEY and PI_API_SECRET environment variables are required for --latest"
    );
    console.error("   Set them in your environment or .env file");
    process.exit(1);
  }

  const response = await fetch(`https://api.podcastindex.org/api/1.0/recent/feeds?max=10`, {
    headers: getHeaders(key, secret),
  });
  const json = (await response.json()) as { feeds: Array<{ url: string; title: string }> };

  for (const feed of json.feeds) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Parsing: ${feed.title}`);
    console.log(`${"=".repeat(60)}`);
    await getFeed(feed.url, { save: shouldSave });
  }
}

function getHeaders(key: string, secret: string): Record<string, string> {
  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const sha1Hash = crypto.createHash("sha1");
  sha1Hash.update(`${key}${secret}${apiHeaderTime}`);
  const hash4Header = sha1Hash.digest("hex");

  return {
    "Content-Type": "application/json",
    "X-Auth-Date": `${apiHeaderTime}`,
    "X-Auth-Key": key,
    Authorization: hash4Header,
    "User-Agent": `partytime/dev`,
  };
}

main()
  .then(() => {
    console.log("\n✅ Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
