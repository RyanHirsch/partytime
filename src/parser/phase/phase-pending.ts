import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalIntegerAttribute,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
  knownLookup,
  lookup,
  pubDateToDate,
} from "../shared";
import type { XmlNode, Episode, RSSFeed } from "../types";
import * as ItemParser from "../item";

import { XmlNodeSource } from "./types";
import { person } from "./phase-2";
import { alternativeEnclosure } from "./phase-3";
import { podcastImages } from "./phase-4";

import type { ItemUpdate } from "./index";

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const defaultNodeTransform = (x: XmlNode): XmlNode => x;
const defaultSupportCheck = (x: XmlNode): boolean => typeof x === "object";

export enum PhasePendingLiveStatus {
  Pending = "pending",
  Live = "live",
  Ended = "ended",
}
type PhasePendingPodcastLiveItemItem = Partial<
  Pick<
    Episode,
    | "title"
    | "description"
    | "link"
    | "guid"
    | "author"
    | "podcastPeople"
    | "alternativeEnclosures"
    | "podcastImages"
  >
>;
export type PhasePendingPodcastLiveItem = {
  status: PhasePendingLiveStatus;
  start: Date;
  end: Date;
  item: PhasePendingPodcastLiveItemItem;
};
export const liveItem = {
  phase: Infinity,
  tag: "podcast:liveItem",
  name: "liveItem",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) =>
      Boolean(
        n &&
          getAttribute(n, "status") &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          lookup(PhasePendingLiveStatus, getAttribute(n, "status")!.toLowerCase()) &&
          getAttribute(n, "start") &&
          getAttribute(n, "end")
      )
    ),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastLiveItems: PhasePendingPodcastLiveItem[] } {
    const useParser = (
      itemUpdate: ItemUpdate,
      n: XmlNode,
      item: PhasePendingPodcastLiveItemItem
    ): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const nodeContents = n[itemUpdate.tag];
      if (nodeContents) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const transformedNode = (itemUpdate.nodeTransform ?? defaultNodeTransform)(nodeContents);
        if (
          transformedNode &&
          (itemUpdate.supportCheck ?? defaultSupportCheck)(transformedNode, XmlNodeSource.Item)
        ) {
          Object.assign(item, itemUpdate.fn(transformedNode, {} as RSSFeed, XmlNodeSource.Item));
        }
      }
    };

    return {
      podcastLiveItems: node
        .map((n) => {
          const item: PhasePendingPodcastLiveItemItem = {
            ...ItemParser.getTitle(n),
            ...ItemParser.getDescription(n),
            ...ItemParser.getLink(n),
            ...ItemParser.getAuthor(n),
          };
          const guid = ItemParser.getGuid(n);
          if (guid) {
            item.guid = guid;
          }

          useParser(person, n, item);
          useParser(alternativeEnclosure, n, item);
          useParser(alternativeEnclosure, n, item);
          useParser(podcastImages, n, item);

          return {
            status: knownLookup(
              PhasePendingLiveStatus,
              getKnownAttribute(n, "status").toLowerCase()
            ),
            start: pubDateToDate(getKnownAttribute(n, "start")),
            end: pubDateToDate(getKnownAttribute(n, "end")),
            ...(Object.keys(item).length > 0 ? { item } : undefined),
          };
        })
        .filter((x) => Boolean(x.start && x.end)) as PhasePendingPodcastLiveItem[],
    };
  },
};

export type PhasePendingPodcastId = {
  platform: string;
  url: string;
  id?: string;
};
export const id = {
  phase: Infinity,
  tag: "podcast:id",
  name: "id",
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
  tag: "podcast:social",
  name: "social",
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

export type PhasePendingPodcastRecommendation = {
  url: string;
  type: string;
  language?: string;
  text?: string;
};
export const podcastRecommendations = {
  phase: Infinity,
  name: "recommendations",
  tag: "podcast:recommendations",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => getAttribute(n, "url") && getAttribute(n, "type")),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastRecommendations: PhasePendingPodcastRecommendation[] } {
    return {
      podcastRecommendations: node.map((n) => ({
        url: getKnownAttribute(n, "url"),
        type: getKnownAttribute(n, "type"),
        ...extractOptionalStringAttribute(n, "language"),
        ...(getText(n) ? { text: getText(n) } : undefined),
      })),
    };
  },
};

export type PhasePendingGateway = {
  order?: number;
  message: string;
};
export const podcastGateway = {
  phase: Infinity,
  name: "gateway",
  tag: "podcast:gateway",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getText(n)),
  supportCheck: (node: XmlNode): boolean => Boolean(getText(node)),
  fn(node: XmlNode): { podcastGateway: PhasePendingGateway } {
    return {
      podcastGateway: {
        message: getText(node),
        ...extractOptionalIntegerAttribute(node, "order"),
      },
    };
  },
};
