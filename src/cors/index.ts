import fetch from "node-fetch";
import { zip } from "ramda";
import { parseFeed } from "src/parser";
import type { Episode, FeedObject } from "src/parser/shared";
import { getFeedText } from "src/shared";

export function checkCors(
  urlToCheck: string,
  methodToCheck = "GET",
  origin = "https://podcastcertification.org"
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
    toCheck.podcastChapters = newestEpisode.podcastTranscripts[0].url;
  }

  const corsSupport = await Promise.all(Object.values(toCheck).map((s) => checkCors(s)));
  return Object.fromEntries(zip(Object.keys(toCheck), corsSupport));
}
