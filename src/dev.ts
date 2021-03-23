import * as fs from "fs";
import * as path from "path";
import stringify from "fast-json-stable-stringify";

import { log } from "./logger";
import { parseFeed } from "./parser";
import type { FeedObject } from "./parser/shared";
import { checkFeedByUri } from "./cors";
import { getFeedText } from "./shared";

const feeds = [
  { name: "Podcasting 2.0", url: "http://mp3s.nashownotes.com/pc20rss.xml" },

  // Recent soundbites
  { name: "Golden Nuggets", url: "https://feeds.buzzsprout.com/1293872.rss" },

  // Value Block
  { name: "PodClock", url: "https://podnews.net/clock-rss" },

  // Location
  { name: "That's all I got", url: "https://kevinbae.com/feed/podcast" },

  // nested categories
  { name: "livetpajorden", url: "https://rss.acast.com/http-acast.com-acast.com-livetpajorden" },

  // Example
  {
    name: "Local Example",
    url: `file://${path.resolve(__dirname, "parser/__test__/fixtures/example.xml")}`,
  },

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
];

async function checkAll(): Promise<void> {
  for (let i = 0; i < feeds.length; i += 1) {
    const { name, url } = feeds[i];
    log.info(`Parsing ${name}: ${url}`);
    // eslint-disable-next-line no-await-in-loop
    await getFeed(url);
  }
}

async function getFeed(uri: string): Promise<void> {
  const xml = await getFeedText(uri);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const feedObject: FeedObject = parseFeed(xml);
  fs.writeFileSync(
    path.resolve(
      __dirname,
      "..",
      `results/${feedObject.title.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "")}.json`
    ),
    stringify(feedObject)
  );

  const corsSupport = await checkFeedByUri(uri);
  log.info(corsSupport);

  // eslint-disable-next-line no-underscore-dangle,  @typescript-eslint/no-unsafe-member-access
  log.info(feedObject.__phase);
}

// eslint-disable-next-line no-console
checkAll().then(
  () => log.info("done"),
  (err) => log.error(err)
);

// class HTTPResponseError extends Error {
//   constructor(response, ...args) {
//     this.response = response;
//     super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
//   }
// }

// const checkStatus = (response) => {
//   if (response.ok) {
//     // response.status >= 200 && response.status < 300
//     return response;
//   } else {
//     throw new HTTPResponseError(response);
//   }
// };
