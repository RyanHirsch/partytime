/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getAttribute, getKnownAttribute } from "../shared";
import type { XmlNode } from "../types";

const pubSubLinks = {
  tag: "link",
  nodeTransform: (node: XmlNode[]): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    node.filter((n) => Boolean(getAttribute(n, "href") && getAttribute(n, "rel"))),
  fn(node: XmlNode[]) {
    const getNode = (type: string): XmlNode | null =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      node.find((n) => getAttribute(n, "rel") === type);

    const selfNode = getNode("self");
    const hubNode = getNode("hub");
    const nextNode = getNode("next");

    if (!selfNode && !hubNode && !nextNode) {
      return undefined;
    }
    const pubsub: { hub?: string; self?: string; next?: string } = {};

    if (selfNode) {
      pubsub.self = getKnownAttribute(selfNode, "href");
    }
    if (hubNode) {
      pubsub.hub = getKnownAttribute(hubNode, "href");
    }
    if (nextNode) {
      pubsub.next = getKnownAttribute(nextNode, "href");
    }
    return { pubsub };
  },
};

export const config = {
  namespace: "http://www.w3.org/2005/Atom",
  items: [],
  feed: { link: pubSubLinks },
};
