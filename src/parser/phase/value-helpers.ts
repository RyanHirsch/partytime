import {
  extractOptionalStringAttribute,
  getAttribute,
  getBooleanAttribute,
  getKnownAttribute,
} from "../shared";
import type { XmlNode } from "../types";

import type { Phase4ValueRecipient } from "./phase-4";

export const validRecipient = (n: XmlNode): boolean =>
  Boolean(getAttribute(n, "type") && getAttribute(n, "address") && getAttribute(n, "split"));

export function extractRecipients(nodes: XmlNode[]): Phase4ValueRecipient[] {
  return nodes.filter(validRecipient).map((innerNode) => ({
    ...extractOptionalStringAttribute(innerNode, "name"),
    ...extractOptionalStringAttribute(innerNode, "customKey"),
    ...extractOptionalStringAttribute(innerNode, "customValue"),
    type: getKnownAttribute(innerNode, "type"),
    address: getKnownAttribute(innerNode, "address"),
    split: parseInt(getKnownAttribute(innerNode, "split"), 10),
    fee: getBooleanAttribute(innerNode, "fee"),
  }));
}
