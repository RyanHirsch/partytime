/* eslint-disable @typescript-eslint/no-unsafe-return */
// taken from https://github.com/jonschlinkert/unescape
const regexCache: Record<keyof typeof charSets, RegExp | undefined> = {
  default: undefined,
  extras: undefined,
  all: undefined,
};

const defaultCharSet = {
  "&quot;": '"',
  "&#34;": '"',

  "&apos;": "'",
  "&#39;": "'",

  "&amp;": "&",
  "&#38;": "&",

  "&gt;": ">",
  "&#62;": ">",

  "&lt;": "<",
  "&#60;": "<",
};
const extrasCharSet = {
  "&cent;": "¢",
  "&#162;": "¢",

  "&copy;": "©",
  "&#169;": "©",

  "&euro;": "€",
  "&#8364;": "€",

  "&pound;": "£",
  "&#163;": "£",

  "&reg;": "®",
  "&#174;": "®",

  "&yen;": "¥",
  "&#165;": "¥",
};

const charSets = {
  default: defaultCharSet,
  extras: extrasCharSet,
  all: { ...defaultCharSet, ...extrasCharSet },
};

/**
 * Convert HTML entities to HTML characters.
 *
 * @param  {String} `str` String with HTML entities to un-escape.
 * @return {String}
 */

export function unescape(str: string, type: keyof typeof charSets = "default"): string {
  if (!isString(str)) return "";
  const chars = charSets[type];
  const regex = toRegex(type, chars);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return str.replace(regex, (m) => chars[m]);
}

function toRegex(type: keyof typeof charSets, chars: Record<string, string>): RegExp {
  const cachedVal = regexCache[type];
  if (cachedVal) {
    return cachedVal;
  }
  const keys = Object.keys(chars).join("|");
  const regex = new RegExp(`(?=(${keys}))\\1`, "g");
  regexCache[type] = regex;
  return regex;
}

/**
 * Returns true if str is a non-empty string
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isString(str: any): str is string {
  return Boolean(str) && typeof str === "string";
}
