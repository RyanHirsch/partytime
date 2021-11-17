import { config as atomConfig } from "./atom";
import { NamespaceConfig } from "./types";

export const supportedNamespaces = [atomConfig].reduce((map, config) => {
  map.set(config.namespace.toLowerCase(), config);
  return map;
}, new Map<string, NamespaceConfig>());
