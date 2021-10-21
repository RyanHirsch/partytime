import parser, { ValidationError } from "fast-xml-parser";
import he from "he";
import { XmlNode } from "./types";

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
