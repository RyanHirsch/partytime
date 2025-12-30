import { XMLParser, XMLValidator, ValidationError } from "fast-xml-parser";
import he from "he";

import { XmlNode } from "./types";

const parserOptions = {
  attributeNamePrefix: "@_",
  attributesGroupName: "attr",
  textNodeName: "#text",
  ignoreAttributes: false,
  removeNSPrefix: false,
  allowBooleanAttributes: false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  tagValueProcessor: (_tagName: string, tagValue: string) => he.decode(tagValue),
  stopNodes: ["*.parse-me-as-string"],
};

const xmlParser = new XMLParser(parserOptions);

export function validate(xml: string): true | ValidationError {
  return XMLValidator.validate(xml.trim());
}

export function parse(xml: string): XmlNode {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return xmlParser.parse(xml.trim());
}

export type { ValidationError };
