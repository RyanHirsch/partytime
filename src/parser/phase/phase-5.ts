import {
  getAttribute,
  getText,
  ensureArray,
  pubDateToDate,
  extractOptionalFloatAttribute,
} from "../shared";
import type { FeedObject, XmlNode } from "../types";

import { XmlNodeSource } from "./types";

import type { FeedUpdate } from "./index";

function getSocialPlatform(n: XmlNode): string | null {
  return (getAttribute(n, "platform") || getAttribute(n, "protocol")) ?? null;
}

function getSocialAccount(n: XmlNode): string | null {
  return (getAttribute(n, "podcastAccountId") || getAttribute(n, "accountId")) ?? null;
}
function getSocialUrl(n: XmlNode): string | null {
  return (getAttribute(n, "uri") || getText(n)) ?? null;
}
function getSocialProfileUrl(n: XmlNode): string | null {
  return getAttribute(n, "accountUrl") ?? null;
}

export type Phase5SocialInteract = {
  /** slug of social protocol being used */
  platform: string;
  /** account id of posting party */
  id: string;
  /** uri of root post/comment */
  url: string;
  /** url to posting party's platform profile */
  profileUrl?: string;
  /** DEPRECATED */
  pubDate?: Date;
  /** the order of rendering */
  priority?: number;
};
export const socialInteraction = {
  phase: 5,
  name: "socialInteract",
  tag: "podcast:socialInteract",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Item &&
    node.some((n) => Boolean(getSocialPlatform(n)) && Boolean(getSocialUrl(n))),
  fn(node: XmlNode[]): { podcastSocialInteraction: Phase5SocialInteract[] } {
    const isValidItemNode = (n: XmlNode): boolean =>
      Boolean(getSocialPlatform(n)) && Boolean(getSocialUrl(n));

    return {
      podcastSocialInteraction: node.reduce<Phase5SocialInteract[]>((acc, n) => {
        if (isValidItemNode(n)) {
          const profileUrl = getSocialProfileUrl(n);
          const pubDateText = getAttribute(n, "pubDate");
          const pubDateAsDate = pubDateText && pubDateToDate(pubDateText);
          return [
            ...acc,
            {
              platform: getSocialPlatform(n) ?? "",
              id: getSocialAccount(n) ?? "", // per https://podcastindex.social/@mitch/109821341789189954
              url: getSocialUrl(n) ?? "",
              ...extractOptionalFloatAttribute(n, "priority"),
              ...(pubDateAsDate ? { pubDate: pubDateAsDate } : undefined),
              ...(profileUrl ? { profileUrl } : undefined),
            },
          ];
        }

        return acc;
      }, []),
    };
  },
};

export enum Phase5Blocked {
  /** Block everyone */
  Yes = "yes",
  /** Block no-one */
  No = "no",
  /** Block specific platforms */
  Partial = "partial",
}
export type Phase5BlockedPlatforms = Record<string, boolean>;
type BlockedReturnType = Required<Pick<FeedObject, "podcastBlocked" | "podcastBlockedPlatforms">>;

export const block: FeedUpdate = {
  tag: "podcast:block",
  name: "block",
  phase: 5,
  nodeTransform: (nodes: XmlNode | XmlNode[]) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(nodes).filter((x) => /(yes|no)/i.test(getText(x))),
  supportCheck: (node: XmlNode[]) => node.length > 0,
  fn(nodes: XmlNode[]): BlockedReturnType {
    const initialValue = {
      podcastBlocked: Phase5Blocked.No,
      podcastBlockedPlatforms: {},
    } as BlockedReturnType;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
    return nodes.reduce((agg: BlockedReturnType, node) => {
      const specifiedId = getAttribute(node, "id");
      if (specifiedId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...agg,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          podcastBlockedPlatforms: {
            ...agg.podcastBlockedPlatforms,
            [specifiedId]: /yes/i.test(getText(node)),
          },
        };
      }

      if (specifiedId === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...agg,
          podcastBlocked: /yes/i.test(getText(node)) ? Phase5Blocked.Yes : Phase5Blocked.No,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return agg;
    }, initialValue);
  },
};

export function isSafeToIngest(feed: FeedObject, serviceName: string): boolean {
  const explicitValue = feed.podcastBlockedPlatforms?.[serviceName];

  return typeof explicitValue === "boolean"
    ? !explicitValue
    : feed.podcastBlocked === Phase5Blocked.No;
}

export function isServiceBlocked(feed: FeedObject, serviceName: string): boolean {
  const explicitValue = feed.podcastBlockedPlatforms?.[serviceName];

  return typeof explicitValue === "boolean"
    ? explicitValue
    : feed.podcastBlocked === Phase5Blocked.Yes;
}
