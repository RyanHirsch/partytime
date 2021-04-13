import { ensureArray, getAttribute, getNumber, getText } from "../shared";
import { PersonGroup, PersonRole } from "../person-enum";

import type {
  Episode,
  FeedObject,
  Person,
  PodcastEpisodeNumber,
  PodcastSeasonNumber,
  TODO,
} from "../shared";
import type { FeedUpdate, ItemUpdate } from "./index";

// #region Phase 2
export const person: FeedUpdate | ItemUpdate = {
  phase: 2,
  tag: "person",
  // As long as one of the person tags has text, well consider it valid
  supportCheck: (node) => ensureArray(node).some((n) => Boolean(getText(n))),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update = {
      podcastPersons: [] as Person[],
    };

    const groups = Object.values(PersonGroup);
    const roles = Object.values(PersonRole);

    ensureArray(node).forEach((personNode) => {
      const name = getText(personNode);
      const role =
        roles.find((r) => r.toLowerCase() === getAttribute(personNode, "role")?.toLowerCase()) ??
        PersonRole.Host;
      const group =
        groups.find((g) => g.toLowerCase() === getAttribute(personNode, "group")?.toLowerCase()) ??
        PersonGroup.Cast;
      const img = getAttribute(personNode, "img");
      const href = getAttribute(personNode, "href");

      if (name) {
        const personObj: Person = {
          name,
          role,
          group,
        };

        if (img) {
          personObj.img = img;
        }
        if (href) {
          personObj.href = href;
        }

        update.podcastPersons.push(personObj);
      }
    });

    return update;
  },
};

export const location: FeedUpdate | ItemUpdate = {
  phase: 2,
  tag: "location",
  supportCheck: (node: TODO) => Boolean(getText(node)),
  fn(node: TODO): Partial<FeedObject> | Partial<Episode> {
    const update: Partial<FeedObject> | Partial<Episode> = {};
    const name = getText(node);
    const openStreetMaps = getAttribute(node, "osm");
    const geoUri = getAttribute(node, "geo");
    if (name) {
      update.podcastLocation = {
        name,
      };

      if (openStreetMaps) {
        update.podcastLocation.osm = openStreetMaps;
      }

      if (geoUri) {
        update.podcastLocation.geo = geoUri;
      }
    }
    return update;
  },
};

export const season: ItemUpdate = {
  phase: 2,
  tag: "season",
  supportCheck: (node) => Boolean(getNumber(node)),
  fn(node) {
    const itemUpdate = {
      podcastSeason: {
        number: getNumber(node),
      } as PodcastSeasonNumber,
    };

    const name = getAttribute(node, "name");
    if (name) {
      itemUpdate.podcastSeason.name = name;
    }

    return itemUpdate;
  },
};

export const episode: ItemUpdate = {
  phase: 2,
  tag: "episode",
  supportCheck: (node) => Boolean(getNumber(node)),

  fn(node) {
    const itemUpdate = {
      podcastEpisode: {
        number: getNumber(node),
      } as PodcastEpisodeNumber,
    };

    const display = getAttribute(node, "display");
    if (display) {
      itemUpdate.podcastEpisode.display = display;
    }

    return itemUpdate;
  },
};

// #endregion
