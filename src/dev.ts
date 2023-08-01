/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

import stringify from "fast-json-stable-stringify";
import { getStream$ } from "podping-client";
import { take } from "rxjs/operators";

import { logger } from "./logger";
import { parseFeed } from "./parser";
// import { checkFeedByUri } from "./cor";
import { getFeedText } from "./shared";

const feeds: Array<{ name: string; url: string }> = [
  // { name: "Podcasting 2.0", url: "http://mp3s.nashownotes.com/pc20rss.xml" },
  // // Recent soundbites
  // { name: "Golden Nuggets", url: "https://feeds.buzzsprout.com/1293872.rss" },
  // // Value Block
  // { name: "PodClock", url: "https://podnews.net/clock-rss" },
  // // Location
  // { name: "That's all I got", url: "https://kevinbae.com/feed/podcast" },
  // // nested categories
  // { name: "livetpajorden", url: "https://rss.acast.com/http-acast.com-acast.com-livetpajorden" },
  // // Example
  // {
  //   name: "Local Example",
  //   url: `file://${path.resolve(__dirname, "parser/__test__/fixtures/example.xml")}`,
  // },
  // {
  //   name: "Animated No Agenda",
  //   url: "https://noagendatube.com/feeds/videos.xml?videoChannelId=73&format=podcast",
  // },
  // {
  //   name: "Chad Hartman",
  //   url:
  //     "https://www.omnycontent.com/d/playlist/4b5f9d6d-9214-48cb-8455-a73200038129/1c3da022-ec7e-4a7f-91dc-a78e00380a9d/44fb8925-fb04-4712-903e-a78e00380aa1/podcast.rss",
  // },
  // { name: "Channel History Hit", url: "http://rss.acast.com/channelhistoryhit" },
  // { name: "Chaosradio", url: "https://chaosradio.de/feed/m4a" },
  // { name: "Chaosradio Freiburg", url: "https://rdl.de/podcast/all/35236" },
  // {
  //   name: "Cheat Sheet Podcast from The Daily Beast",
  //   url: "https://rss.acast.com/cheat-sheet-podcast",
  // },
  // { name: "Chompers", url: "https://feeds.megaphone.fm/chompers" },
  // {
  //   name: 'Chris Walker - "The Innerwealth Podcast"',
  //   url: "http://feeds.soundcloud.com/users/soundcloud:users:2321682/sounds.rss",
  // },
  // { name: "Christopher Walch – SDWT", url: "https://anchor.fm/s/5720588/podcast/rss" },
  // { name: "Clark Film", url: "https://clarkfilm.libsyn.com/rss" },
  // {
  //   name: "Cliffo and Gabi - Hit Queensland",
  //   url:
  //     "https://www.omnycontent.com/d/playlist/566281f8-200e-4c9f-8378-a4870055423b/dbd79469-2427-4cb3-bd47-a636000b0b05/984b7b50-dc38-4e9b-b153-a636000b985b/podcast.rss",
  // },
  // { name: "Coach's Fitness Journey", url: "https://anchor.fm/s/e5ef6d8/podcast/rss" },
  // { name: "CoinDesk Podcast Network", url: "https://rss.art19.com/late-confirmation" },
  // { name: "CommSec", url: "https://commsecpodcasts.podbean.com/feed.xml" },
  // {
  //   name: "Confidence &amp; Self Esteem Podcast",
  //   url: "https://www.spreaker.com/show/3128218/episodes/feed",
  // },
  // {
  //   name: "Connect FM Podcasts",
  //   url: "http://feeds.soundcloud.com/users/soundcloud:users:79112501/sounds.rss",
  // },
  // {
  //   name: "Conservative Business Journal Podcast",
  //   url: "https://conservativebusinessjournal.libsyn.com/rss",
  // },
  // { name: "Cooper And Anthony Show", url: "https://anchor.fm/s/245b3618/podcast/rss" },
  // {
  //   name: "Costa Rica Pura Vida Lifestyle Podcast",
  //   url: "https://anchor.fm/s/1347e704/podcast/rss",
  // },
  // {
  //   name: "Crime Stories with Nancy Grace",
  //   url: "https://rss.art19.com/crime-stories-with-nancy-grace",
  // },
  // { name: "Gabfest", url: "https://gabfest.wordpress.com/feed/atom/" },
  // { name: "The Her Freedom Podcast", url: "http://herfreedomaudio.blogspot.de/atom.xml" },
  // { name: "Causality", url: "https://engineered.network/causality/feed/index.xml" },
  // { name: "Dudes and Dads", url: "https://feeds.podcastmirror.com/dudesanddadspodcast" },
];

export async function checkAll(): Promise<void> {
  for (let i = 0; i < feeds.length; i += 1) {
    const { name, url } = feeds[i];
    logger.info(`Parsing ${name}: ${url}`);
    // eslint-disable-next-line no-await-in-loop
    await getFeed(url);
  }
}

function save<T>({
  relativePath,
  data,
  parser,
}: {
  relativePath: string;
  data: T;
  parser: (d: T) => string;
}): Promise<void> {
  const filePath = path.resolve(__dirname, relativePath);
  logger.info(`Save ${filePath}`);
  return new Promise((resolve, reject) =>
    fs.writeFile(filePath, parser(data), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    })
  );
}

const urlToFile: Array<{ uri: string; uriHash: string; title: string; parsed: string }> = [];
async function getFeed(uri: string): Promise<void> {
  const uriHash = crypto.createHash("md5").update(uri).digest("hex");

  const xml = await getFeedText(uri);
  const xmlSave = save({
    relativePath: `../raw/${uriHash}.txt`,
    data: xml,
    parser: (x) => x,
  });

  const feedObject = parseFeed(xml);
  if (!feedObject) {
    logger.warn(`Failed to parse xml from ${uri}`);
    return;
  }

  urlToFile.push({
    uri,
    uriHash,
    title: feedObject.title,
    parsed: `${feedObject.title.toLowerCase().replace(/'/g, "").replace(/\W+/g, "-")}.json`,
  });
  const listSave = save({
    relativePath: `../raw/list.json`,
    data: urlToFile,
    parser: (list) => JSON.stringify(list, null, 2),
  });

  const parsed = path.resolve(
    __dirname,
    "..",
    `results/${feedObject.title.toLowerCase().replace(/'/g, "").replace(/\W+/g, "-")}.json`
  );
  logger.info(`Parsed feed object ${parsed}`);
  fs.writeFileSync(parsed, stringify({ ...feedObject, url: uri }));
  await Promise.all([xmlSave, listSave]);

  // const corsSupport = await checkFeedByUri(uri);
  // logger.info(corsSupport);

  // eslint-disable-next-line no-underscore-dangle,  @typescript-eslint/no-unsafe-member-access
  logger.info(feedObject.pc20support);
}

if (process.argv[2] === "--latest") {
  runPromise(
    new Promise((resolve) => {
      getStream$()
        .pipe(take(1))
        .subscribe({
          next(val) {
            resolve(getFeed(val.url));
          },
          complete() {
            logger.info("complete");
          },
        });
    })
  );
} else if (process.argv[2]) {
  runPromise(getFeed(process.argv[2]));
}

function runPromise(prom: Promise<any>): void {
  prom
    .then(
      () => logger.info("done"),
      (err) => logger.error(err)
    )
    .finally(() => process.exit());
}
