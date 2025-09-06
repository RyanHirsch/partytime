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

/**
 * Preprocesses XML by minifying it to fix common formatting issues
 * This is much simpler and more robust than complex regex patterns
 */
function preprocessXml(xml: string): string {
  return xml
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // Remove all unnecessary whitespace and newlines
    .replace(/\s+/g, ' ')
    
    // Fix spacing around equals signs in attributes
    .replace(/\s*=\s*/g, '=')
    .replace(/=\s*"/g, '="')
    .replace(/=\s*'/g, "='")
    
    // Clean up tag boundaries
    .replace(/>\s*</g, '><')
    .replace(/\s*\/>/g, '/>')
    
    // Trim the result
    .trim();
}

export function validate(xml: string): true | ValidationError {
  const preprocessed = preprocessXml(xml.trim());
  return parser.validate(preprocessed);
}

export function parse(xml: string): XmlNode {
  const preprocessed = preprocessXml(xml.trim());
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parser.parse(preprocessed, parserOptions);
}
