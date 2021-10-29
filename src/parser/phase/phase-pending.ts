import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
  lookup,
  pubDateToDate,
} from "../shared";
import type { XmlNode } from "../types";

import { XmlNodeSource } from "./types";

import type { FeedUpdate } from ".";

export type PhasePendingPodcastId = {
  platform: string;
  url: string;
  id?: string;
};
export const id = {
  phase: Infinity,
  tag: "id",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[]): boolean =>
    node.some((n) => Boolean(getAttribute(n, "platform")) && Boolean(getAttribute(n, "url"))),
  fn(node: XmlNode[]): { podcastId: PhasePendingPodcastId[] } {
    return {
      podcastId: node
        .map((n) => ({
          platform: getAttribute(n, "platform"),
          url: getAttribute(n, "url"),
          ...extractOptionalStringAttribute(n, "id"),
        }))
        .filter((x) => Boolean(x.platform) && Boolean(x.url)) as PhasePendingPodcastId[],
    };
  },
};

export type PhasePendingSocial = {
  platform: string;
  url: string;
  id?: string;
  name?: string;
  priority?: number;
  signUp?: SocialSignUp[];
};
type SocialSignUp = {
  homeUrl: string;
  signUpUrl: string;
  priority?: number;
};
export const social = {
  phase: Infinity,
  tag: "social",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Feed &&
    node.some(
      (n) =>
        Boolean(getAttribute(n, "platform")) &&
        (Boolean(getAttribute(n, "url")) || Boolean(getAttribute(n, "podcastAccountUrl")))
    ),
  fn(node: XmlNode[]): { podcastSocial: PhasePendingSocial[] } {
    const isValidFeedNode = (n: XmlNode): boolean =>
      Boolean(getAttribute(n, "platform")) &&
      (Boolean(getAttribute(n, "url")) || Boolean(getAttribute(n, "podcastAccountUrl")));

    return {
      podcastSocial: node.reduce<PhasePendingSocial[]>((acc, n) => {
        const url = getAttribute(n, "url") || getAttribute(n, "podcastAccountUrl");
        if (isValidFeedNode(n) && url) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const signUps = ensureArray(n["podcast:socialSignUp"]);
          const name = getText(n);

          const signUp =
            signUps.length > 0
              ? {
                  signUp: signUps.reduce<SocialSignUp[]>((signUpAcc, signUpNode: XmlNode) => {
                    if (
                      getAttribute(signUpNode, "signUpUrl") &&
                      getAttribute(signUpNode, "homeUrl")
                    ) {
                      return [
                        ...signUpAcc,
                        {
                          signUpUrl: getKnownAttribute(signUpNode, "signUpUrl"),
                          homeUrl: getKnownAttribute(signUpNode, "homeUrl"),
                          ...extractOptionalFloatAttribute(signUpNode, "priority"),
                        },
                      ];
                    }
                    return signUpAcc;
                  }, []),
                }
              : undefined;

          return [
            ...acc,
            {
              url,
              platform: getKnownAttribute(n, "platform"),
              ...(name ? { name } : undefined),
              ...extractOptionalStringAttribute(n, "podcastAccountId", "id"),
              ...extractOptionalFloatAttribute(n, "priority"),
              ...signUp,
            },
          ];
        }

        return acc;
      }, []),
    };
  },
};

export type PhasePendingSocialInteract = {
  platform: string;
  id: string;
  url: string;
  pubDate?: Date;
  priority?: number;
};
export const socialInteraction = {
  phase: Infinity,
  name: "social",
  tag: "podcast:socialInteract",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Item &&
    node.some(
      (n) =>
        Boolean(getAttribute(n, "platform")) &&
        Boolean(getAttribute(n, "podcastAccountId") && Boolean(getText(n)))
    ),
  fn(node: XmlNode[]): { podcastSocialInteraction: PhasePendingSocialInteract[] } {
    const isValidItemNode = (n: XmlNode): boolean =>
      Boolean(getAttribute(n, "platform")) &&
      Boolean(getAttribute(n, "podcastAccountId") && Boolean(getText(n)));

    return {
      podcastSocialInteraction: node.reduce<PhasePendingSocialInteract[]>((acc, n) => {
        if (isValidItemNode(n)) {
          const pubDateText = getAttribute(n, "pubDate");
          const pubDateAsDate = pubDateText && pubDateToDate(pubDateText);
          return [
            ...acc,
            {
              platform: getKnownAttribute(n, "platform"),
              id: getKnownAttribute(n, "podcastAccountId"),
              url: getText(n),
              ...extractOptionalFloatAttribute(n, "priority"),
              ...(pubDateAsDate ? { pubDate: pubDateAsDate } : undefined),
            },
          ];
        }

        return acc;
      }, []),
    };
  },
};

export enum PhasePendingMedium {
  Podcast = "podcast",
  Music = "music",
  Video = "video",
  Film = "film",
  Audiobook = "audiobook",
  Newsletter = "newsletter",
  Blog = "blog",
}
export const medium: FeedUpdate = {
  tag: "podcast:medium",
  name: "medium",
  phase: Infinity,
  nodeTransform: (node: XmlNode) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node).find(
      (n) => getText(n) && lookup(PhasePendingMedium, getText(n).toLowerCase())
    ),
  supportCheck: (node: XmlNode) => Boolean(node) && Boolean(getText(node)),
  fn(node: XmlNode): { medium: PhasePendingMedium } {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = lookup(PhasePendingMedium, nodeValue.toLowerCase());
      if (parsed) {
        return { medium: parsed };
      }
    }
    throw new Error("Unable to extract medium from feed, `supportCheck` needs to be updated");
  },
};
