/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalStringAttribute,
  firstIfArray,
  getAttribute,
  getBooleanAttribute,
  getKnownAttribute,
} from "../shared";
import { logger } from "../../logger";
import type { XmlNode } from "../types";

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#value
 *
 * This element designates the cryptocurrency or payment layer that will be used, the transport method for
 * transacting the payments, and a suggested amount denominated in the given cryptocurrency.
 *
 * Also see: https://github.com/Podcastindex-org/podcast-namespace/blob/main/value/value.md
 */
export type Phase4Value = {
  /**
   * This is the service slug of the cryptocurrency or protocol layer.
   *
   * lightning
   */
  type: string;
  /** This is the transport mechanism that will be used. keysend and amp are the only expected values */
  method: string;
  /** This is an optional suggestion on how much cryptocurrency to send with each payment. */
  suggested?: string;
  recipients: Phase4ValueRecipient[];
};

export type Phase4ValueRecipient = {
  /** A free-form string that designates who or what this recipient is. */
  name?: string;
  /** The name of a custom record key to send along with the payment. */
  customKey?: string;
  /** A custom value to pass along with the payment. This is considered the value that belongs to the customKey. */
  customValue?: string;
  /** A slug that represents the type of receiving address that will receive the payment. */
  type: string;
  /** This denotes the receiving address of the payee. */
  address: string;
  /** The number of shares of the payment this recipient will receive. */
  split: number;
  fee: boolean;
};
const validRecipient = (n: XmlNode): boolean =>
  Boolean(getAttribute(n, "type") && getAttribute(n, "address") && getAttribute(n, "split"));
export const value = {
  phase: 4,
  tag: "podcast:value",
  name: "value",
  nodeTransform: firstIfArray,
  supportCheck: (node: XmlNode): boolean =>
    Boolean(getAttribute(node, "type")) &&
    Boolean(getAttribute(node, "method")) &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ensureArray(node["podcast:valueRecipient"]).filter(validRecipient).length > 0,
  fn(node: XmlNode): { value: Phase4Value } {
    logger.info("value");

    return {
      value: {
        type: getKnownAttribute(node, "type"),
        method: getKnownAttribute(node, "method"),
        ...extractOptionalFloatAttribute(node, "suggested"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        recipients: ensureArray(node["podcast:valueRecipient"])
          .filter(validRecipient)
          .map((innerNode) => ({
            ...extractOptionalStringAttribute(innerNode, "name"),
            ...extractOptionalStringAttribute(innerNode, "customKey"),
            ...extractOptionalStringAttribute(innerNode, "customValue"),
            type: getKnownAttribute(innerNode, "type"),
            address: getKnownAttribute(innerNode, "address"),
            split: parseInt(getKnownAttribute(innerNode, "split"), 10),
            fee: getBooleanAttribute(innerNode, "fee"),
          })),
      },
    };
  },
};
