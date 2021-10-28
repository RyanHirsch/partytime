import fetch from "node-fetch";
import zip from "ramda/src/zip";
import { log } from "../logger";
import { parseFeed } from "../parser";
import type { Episode, FeedObject } from "../parser/types";
import { getFeedText } from "../shared";

const podcastCertification = "https://podcastcertification.org";

export function checkCors(
  urlToCheck: string,
  methodToCheck = "GET",
  origin = podcastCertification
): Promise<boolean> {
  return fetch(urlToCheck, {
    redirect: "follow",
    follow: 20,
    method: "OPTIONS",
    headers: {
      origin,
      "Access-Control-Request-Method": methodToCheck,
    },
  }).then(
    (resp) => {
      return ["*", origin].includes(resp.headers.get("access-control-allow-origin") as string);
      // resp.headers.has("access-control-allow-methods") &&
      // (resp.headers.get("access-control-allow-methods") as string[]).includes(methodToCheck)
    },
    (err) => {
      log.error(err);
      return false;
    }
  );
}

export function checkHotlink(urlToCheck: string, referer = podcastCertification): Promise<boolean> {
  return fetch(urlToCheck, {
    method: "GET",
    headers: {
      referer,
      "user-agent": "partytime/hotlink-check",
    },
  }).then((resp) => {
    return resp.status < 300 && resp.status >= 200;
  });
}

export function checkHttps(urlToCheck: string, referer = podcastCertification): Promise<boolean> {
  return fetch(urlToCheck.replace(/^http:\/\//, "https://"), {
    method: "GET",
    headers: {
      referer,
      "user-agent": "partytime/https-check",
    },
  }).then((resp) => {
    return resp.status < 300 && resp.status >= 200;
  });
}

export async function checkFeedByUri(uri: string): Promise<Record<string, boolean>> {
  const xml = await getFeedText(uri);

  const feedObject = parseFeed(xml);
  if (feedObject) {
    return checkFeedByObject({ uri, feedObject });
  }
  throw new Error(`Feed could not be parsed`);
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function checkFeedByObject({
  uri,
  feedObject,
}: {
  uri: string;
  feedObject: FeedObject;
}): Promise<Record<string, boolean>> {
  const toCheck: Record<string, string> = {};
  if (uri.startsWith("http")) {
    toCheck.corsFeedUri = uri;
  }

  const newestEpisode = feedObject.items.reduce<Episode>(
    (latest, curr) => {
      if (curr.pubDate && !latest.pubDate) {
        return curr;
      }
      if (!curr.pubDate && latest.pubDate) {
        return latest;
      }
      if (curr.pubDate && latest.pubDate && curr.pubDate > latest.pubDate) {
        return curr;
      }
      return latest;
    },
    { pubDate: new Date(0) } as Episode
  );

  if (newestEpisode.enclosure.url) {
    toCheck.corsEpisodeEnclosure = newestEpisode.enclosure.url;
  }
  if (newestEpisode.podcastChapters) {
    toCheck.corsEpisodeChapters = newestEpisode.podcastChapters.url;
  }
  if (
    Array.isArray(newestEpisode.podcastTranscripts) &&
    newestEpisode.podcastTranscripts.length > 0
  ) {
    toCheck.corsEpisodeTranscript = newestEpisode.podcastTranscripts[0].url;
  }

  const corsSupport = await Promise.all(Object.values(toCheck).map((s) => checkCors(s)));
  const resultObject: Record<string, boolean> = Object.fromEntries(
    zip(Object.keys(toCheck), corsSupport)
  );

  if (feedObject.image) {
    resultObject.hotlinkFeedImage = await checkHotlink(feedObject.image.url);
    resultObject.httpsFeedImage = await checkHttps(feedObject.image.url);
  }
  if (newestEpisode.image) {
    resultObject.hotlinkEpisodeImage = await checkHotlink(newestEpisode.image);
    resultObject.httpsEpisodeImage = await checkHttps(newestEpisode.image);
  }

  if (newestEpisode.podcastChapters) {
    resultObject.httpsEpisodeChapters = await checkHttps(newestEpisode.podcastChapters.url);
  }
  if (
    Array.isArray(newestEpisode.podcastTranscripts) &&
    newestEpisode.podcastTranscripts.length > 0
  ) {
    resultObject.httpsEpisodeTranscript = await checkHttps(newestEpisode.podcastTranscripts[0].url);
  }

  return resultObject;
}
