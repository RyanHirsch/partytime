import fetch from "node-fetch";
import { zip } from "ramda";
import { parseFeed } from "../parser";
import type { Episode, FeedObject } from "../parser/shared";
import { getFeedText } from "../shared";

const podcastCertification = "https://podcastcertification.org";

export function checkCors(
  urlToCheck: string,
  methodToCheck = "GET",
  origin = podcastCertification
): Promise<boolean> {
  return fetch(urlToCheck, {
    method: "OPTIONS",
    headers: {
      origin,
      "Access-Control-Request-Method": methodToCheck,
    },
  }).then((resp) => {
    return ["*", origin].includes(resp.headers.get("access-control-allow-origin") as string);
    // resp.headers.has("access-control-allow-methods") &&
    // (resp.headers.get("access-control-allow-methods") as string[]).includes(methodToCheck)
  });
}

export function checkHotlink(urlToCheck: string, referer = podcastCertification): Promise<boolean> {
  return fetch(urlToCheck, {
    method: "GET",
    headers: {
      referer,
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
    },
  }).then((resp) => {
    return resp.status < 300 && resp.status >= 200;
  });
}

export async function checkFeedByUri(uri: string): Promise<Record<string, boolean>> {
  const xml = await getFeedText(uri);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const feedObject: FeedObject = parseFeed(xml);
  return checkFeedByObject({ uri, feedObject });
}

export async function checkFeedByObject({
  uri,
  feedObject,
}: {
  uri: string;
  feedObject: FeedObject;
}): Promise<Record<string, boolean>> {
  const toCheck: Record<string, string> = {};
  if (uri.startsWith("http")) {
    toCheck.feedUri = uri;
  }

  const newestEpisode = feedObject.items.reduce<Episode>(
    (latest, curr) => {
      if (curr.pubDate > latest.pubDate) {
        return curr;
      }
      return latest;
    },
    { pubDate: 0 } as Episode
  );

  if (newestEpisode.enclosure.url) {
    toCheck.enclosure = newestEpisode.enclosure.url;
  }
  if (newestEpisode.podcastChapters) {
    toCheck.podcastChapters = newestEpisode.podcastChapters.url;
  }
  if (
    Array.isArray(newestEpisode.podcastTranscripts) &&
    newestEpisode.podcastTranscripts.length > 0
  ) {
    toCheck.podcastTranscript = newestEpisode.podcastTranscripts[0].url;
  }

  const corsSupport = await Promise.all(Object.values(toCheck).map((s) => checkCors(s)));
  const resultObject: Record<string, boolean> = Object.fromEntries(
    zip(Object.keys(toCheck), corsSupport)
  );

  if (feedObject.image) {
    resultObject.hotlinkFeedImage = await checkHotlink(feedObject.image);
    resultObject.httpsImage = await checkHttps(feedObject.image);
  }
  if (newestEpisode.image) {
    resultObject.hotlinkEpisodeImage = await checkHotlink(newestEpisode.image);
    resultObject.httpsEpisodeImage = await checkHttps(newestEpisode.image);
  }

  if (newestEpisode.podcastChapters) {
    resultObject.httpsPodcastChapters = await checkHttps(newestEpisode.podcastChapters.url);
  }
  if (
    Array.isArray(newestEpisode.podcastTranscripts) &&
    newestEpisode.podcastTranscripts.length > 0
  ) {
    resultObject.httpsPodcastTranscript = await checkHttps(newestEpisode.podcastTranscripts[0].url);
  }

  return resultObject;
}
