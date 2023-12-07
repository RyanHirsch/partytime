import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalIntegerAttribute,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
} from "../shared";
import type { XmlNode } from "../types";

import type { Phase4PodcastLiveItem } from "./phase-4";
import { addSubTag } from "./helpers";
import { XmlNodeSource } from "./types";

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

export type PhasePendingChat = {
  phase: "pending";
  /** (required) The [protocol](https://github.com/Podcastindex-org/podcast-namespace/blob/main/proposal-docs/chat/chatprotocols.txt) in use on the server */
  protocol: string;
  /** (recommended) The account id of the podcaster on the server or platform being connected to. */
  accountId?: string;
  /** (optional) The fqdn of a chat server that serves as the "bootstrap" server to connect to. */
  server?: string;
  /** (optional) Some chat systems have a notion of a chat "space" or "room" or "topic". This attribute will serve
that purpose. */
  space?: string;
  /** (optional) A url to an html rendered version of the chat for loading in a web page or web view. */
  embedUrl?: string;
};

const knownChatProtocols = `
irc
xmpp
nostr
matrix
`
  .split("\n")
  .map((x) => x.trim())
  .filter(Boolean);

function sanitizeProtocol(proto: string): string {
  const known = knownChatProtocols.find((x) => x === proto.toLowerCase());

  if (known) {
    return known;
  }

  console.warn(`Unknown protocol ${proto}, calling .toLowerCase() and passing it through`);

  return proto.toLowerCase();
}

export const podcastChat = {
  phase: Infinity,
  name: "chat",
  tag: "podcast:chat",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getAttribute(n, "protocol")),
  supportCheck: (node: XmlNode): boolean => Boolean(getAttribute(node, "protocol")),
  fn(node: XmlNode): { chat: PhasePendingChat } {
    const protocol = getKnownAttribute(node, "protocol");
    return {
      chat: {
        phase: "pending",
        protocol: sanitizeProtocol(protocol),
        ...extractOptionalStringAttribute(node, "accountId"),
        ...extractOptionalStringAttribute(node, "server"),
        ...extractOptionalStringAttribute(node, "space"),
        ...extractOptionalStringAttribute(node, "embedUrl"),
      },
    };
  },
};

addSubTag<Phase4PodcastLiveItem>("liveItem", podcastChat);

export type PhasePendingLiveUpdates = {
  uri: string;
  protocol: "socket.io" | "websocket" | "xmpp" | "unknown";
};
function getLiveUpdateProtocol(node: XmlNode): "socket.io" | "websocket" | "xmpp" | "unknown" {
  switch (getAttribute(node, "protocol")) {
    case "socket.io":
      return "socket.io" as const;
    case "webscocket":
      return "websocket" as const;
    case "xmpp":
      return "xmpp" as const;
    default:
      console.warn(`Unknown update protocol ${getAttribute(node, "protocol") ?? "null"}`);
      return "unknown" as const;
  }
}
export const podcastLiveUpdates = {
  phase: Infinity,
  name: "liveValue",
  tag: "podcast:liveValue",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getAttribute(n, "protocol") && getAttribute(n, "uri")),
  supportCheck: (node: XmlNode): boolean =>
    Boolean(getAttribute(node, "protocol")) && Boolean(getAttribute(node, "uri")),
  fn(node: XmlNode): { liveUpdates: PhasePendingLiveUpdates } {
    return {
      liveUpdates: {
        uri: getKnownAttribute(node, "uri"),
        protocol: getLiveUpdateProtocol(node),
      },
    };
  },
};
addSubTag("liveItem", podcastLiveUpdates);
