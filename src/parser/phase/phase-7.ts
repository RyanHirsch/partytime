import invariant from "tiny-invariant";

import { logger } from "../../logger";
import {
  ensureArray,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
} from "../shared";
import { XmlNode } from "../types";

import { addSubTag } from "./helpers";
import { Phase4PodcastLiveItem } from "./phase-4";

export type Phase7Chat = {
  phase: "7";
  /** (required) The fqdn of a chat server that serves as the "bootstrap" server to connect to. */
  server: string;
  /** (required) The [protocol](https://github.com/Podcastindex-org/podcast-namespace/blob/main/proposal-docs/chat/chatprotocols.txt) in use on the server */
  protocol: string;
  /** (recommended) The account id of the podcaster on the server or platform being connected to. */
  accountId?: string;
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

  logger.warn(`Unknown protocol ${proto}, calling .toLowerCase() and passing it through`);

  return proto.toLowerCase();
}

export const podcastChat = {
  phase: 7,
  name: "chat",
  tag: "podcast:chat",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getAttribute(n, "protocol") && getAttribute(n, "server")),
  supportCheck: (node: XmlNode): boolean =>
    Boolean(getAttribute(node, "protocol") && getAttribute(node, "server")),
  fn(node: XmlNode): { chat: Phase7Chat } {
    const protocol = getKnownAttribute(node, "protocol");
    const server = getKnownAttribute(node, "server");
    return {
      chat: {
        phase: "7",
        protocol: sanitizeProtocol(protocol),
        server,
        ...extractOptionalStringAttribute(node, "accountId"),
        ...extractOptionalStringAttribute(node, "space"),
      },
    };
  },
};

addSubTag<Phase4PodcastLiveItem>("liveItem", podcastChat);

function getPublisherRemoteItem(node: XmlNode): XmlNode | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const remoteItem = node["podcast:remoteItem"];
  return ensureArray(remoteItem).find(
    (n) => getAttribute(n, "medium") === "publisher" && getAttribute(n, "feedGuid")
  );
}
export type Phase7Publisher = {
  feedGuid: string;
  feedUrl?: string;
};
export const podcastPublisher = {
  phase: 7,
  name: "publisher",
  tag: "podcast:publisher",
  supportCheck: (node: XmlNode): boolean => {
    if (Array.isArray(node)) return false;
    return Boolean(getPublisherRemoteItem(node));
  },
  fn(node: XmlNode): { podcastPublisher: Phase7Publisher } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const publisherItem = getPublisherRemoteItem(node);
    invariant(publisherItem);
    return {
      podcastPublisher: {
        feedGuid: getKnownAttribute(publisherItem, "feedGuid"),
        ...extractOptionalStringAttribute(publisherItem, "feedUrl"),
      },
    };
  },
};
