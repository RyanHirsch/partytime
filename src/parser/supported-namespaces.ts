import { config as atomConfig } from "./atom";
import { config as itunesConfig } from "./itunes";
import { config as podcastConfig } from "./podcast";
import { config as rssConfig } from "./rss";
import { NamespaceConfig } from "./types";

export const supportedNamespaces = [atomConfig, itunesConfig, podcastConfig, rssConfig].reduce(
  (map, config) => {
    map.set(config.namespace.toLowerCase(), config);
    return map;
  },
  new Map<string, NamespaceConfig>()
);
