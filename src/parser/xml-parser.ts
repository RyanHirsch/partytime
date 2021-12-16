/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import parser, { ValidationError } from "fast-xml-parser";
import he from "he";
import pick from "just-pick";
import omit from "just-omit";
import isEmpty from "just-is-empty";

import { logger } from "../logger";

import { getAttribute } from "./shared";
import { TODO, XmlNode } from "./types";

const parserOptions = {
  attributeNamePrefix: "@_",
  attrNodeName: "attr", // default is 'false'
  textNodeName: "#text",
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  // cdataTagName: "__cdata", //default is 'false'
  // cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, // "strict"
  tagValueProcessor: (val: string) => he.decode(val), // default is a=>a
  stopNodes: ["parse-me-as-string"],
};

export function validate(xml: string): true | ValidationError {
  return parser.validate(xml.trim());
}

export function parse(xml: string): XmlNode {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parser.parse(xml.trim(), parserOptions);
}

export type ClassifiedNode = { ns: string; tag: string; value: TODO };
// eslint-disable-next-line sonarjs/cognitive-complexity
export function classifyChildren(
  declaredNamespaces: Array<{ alias: string; namespace: string }>,
  parserSupportedNamespaces: Set<string>,
  starting: XmlNode
): ClassifiedNode[] | string | number | boolean {
  if (
    typeof starting === "string" ||
    typeof starting === "number" ||
    typeof starting === "boolean"
  ) {
    return starting;
  }

  const getValueAndAttrs = (node: XmlNode): TODO => {
    if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
      return { value: node };
    }
    const value = omit(node, ["attr", "#text"]);
    const attrAndText = pick(node, "attr", "#text");
    return {
      ...(value && !isEmpty(value)
        ? { value: classifyChildren(declaredNamespaces, parserSupportedNamespaces, value) }
        : undefined),
      ...(attrAndText && !isEmpty(attrAndText) ? attrAndText : undefined),
    };
  };

  return Object.entries(starting)
    .reduce((result, [tagName, node]) => {
      const isNamespacedTag = tagName.includes(":");

      if (isNamespacedTag) {
        const [alias, tag] = tagName.split(":");
        const knownNamespace = declaredNamespaces.find((ns) => ns.alias === alias.toLowerCase());
        if (knownNamespace && parserSupportedNamespaces.has(knownNamespace.namespace)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return [
            ...result,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
            ...(Array.isArray(node) ? node : [node]).map((n) => ({
              ns: knownNamespace.namespace,
              ...getValueAndAttrs(n),
              tag,
            })),
          ];
        }
        logger.warn(
          `${tagName} was detected as belonging to a namespace, but that namespace isn't declared at the top of the xml document`
        );
        return result;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return [
        ...result,
        ...(Array.isArray(node) ? node : [node]).map((n) => {
          return {
            ns: getAttribute(n, "xmlns") ?? "",
            tag: tagName,
            ...getValueAndAttrs(n),
          };
        }),
      ];
    }, [] as ClassifiedNode[])
    .sort(nsTagSort);
}

const nsTagSort = (a: ClassifiedNode, b: ClassifiedNode): number => {
  if (a.ns < b.ns) {
    return -1;
  }
  if (a.ns > b.ns) {
    return 1;
  }

  if (a.tag < b.tag) {
    return -1;
  }
  if (a.tag > b.tag) {
    return 1;
  }

  return 0;
};
