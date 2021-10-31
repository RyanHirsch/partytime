import { ensureArray, firstIfArray, getAttribute, getNumber, getText } from "../shared";
import { PersonGroup, PersonRole } from "../person-enum";
import type { XmlNode } from "../types";

import type { ItemUpdate } from "./index";

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#person
 *
 * This element specifies a person of interest to the podcast. It is primarily intended to identify
 * people like hosts, co-hosts and guests.
 */
export type Phase2Person = {
  name: string;
  /** Used to identify what role the person serves on the show or episode. This should be a reference to an official role within the Podcast Taxonomy Project list */
  role: PersonRole;
  /** This should be a reference to an official group within the Podcast Taxonomy Project list */
  group: PersonGroup;
  /** This is the url of a picture or avatar of the person */
  img?: string;
  /** The url to a relevant resource of information about the person, such as a homepage or third-party profile platform. */
  href?: string;
};
export const person = {
  phase: 2,
  tag: "podcast:person",
  name: "person",
  nodeTransform: ensureArray,
  // As long as one of the person tags has text, we'll consider it valid
  supportCheck: (node: XmlNode): boolean =>
    (node as XmlNode[]).some((n: XmlNode) => Boolean(getText(n))),
  fn(node: XmlNode): { podcastPeople: Phase2Person[] } {
    const podcastPeople: Phase2Person[] = [];

    const groups = Object.values(PersonGroup);
    const roles = Object.values(PersonRole);

    (node as XmlNode[]).forEach((personNode: XmlNode) => {
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
        const personObj: Phase2Person = {
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

        podcastPeople.push(personObj);
      }
    });

    return { podcastPeople };
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#location
 *
 * This tag is intended to describe the location of editorial focus for a podcast's content (i.e. "what
 * place is this podcast about?"). The tag has many use cases and is one of the more complex ones.
 *
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/location/location.md
 */
export type Phase2Location = {
  /** This is meant for podcast apps to display the name of the location that the podcast is about. */
  name: string;
  /** From an OpenStreetMap query. If a value is given for osm it must contain both 'type' and 'id'. */
  osm?: string;
  /** A geo URI, conformant to RFC 5870 */
  geo?: string;
};
export const location = {
  phase: 2,
  tag: "podcast:location",
  name: "location",
  nodeTransform: firstIfArray,
  supportCheck: (node: XmlNode): boolean => Boolean(getText(node)),
  fn(node: XmlNode): { podcastLocation: Phase2Location } {
    const update: { podcastLocation: Phase2Location } = {
      podcastLocation: { name: getText(node) },
    };
    const openStreetMaps = getAttribute(node, "osm");
    const geoUri = getAttribute(node, "geo");

    if (openStreetMaps) {
      update.podcastLocation.osm = openStreetMaps;
    }

    if (geoUri) {
      update.podcastLocation.geo = geoUri;
    }

    return update;
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#season
 *
 * This element allows for identifying which episodes in a podcast are part of a particular "season",
 * with an optional season name attached. The number here is an integer so it must be a non-decimal
 */
export type Phase2SeasonNumber = {
  number: number;
  name?: string;
};

export const season: ItemUpdate = {
  phase: 2,
  tag: "podcast:season",
  name: "season",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getNumber(node)),
  fn(node) {
    const itemUpdate = {
      podcastSeason: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        number: Math.floor(getNumber(node)!),
      } as Phase2SeasonNumber,
    };

    const name = getAttribute(node, "name");
    if (name) {
      itemUpdate.podcastSeason.name = name;
    }

    return itemUpdate;
  },
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#episode
 *
 * This element exists largely for compatibility with the season tag. But, it also allows for a similar
 * idea to what "name" functions as in that element.
 *
 * The episode numbers are decimal, so numbering such as 100.5 is acceptable if there was a special
 * mini-episode published between two other episodes. In that scenario, the number would help with proper
 * chronological sorting, while the display attribute could specify an alternate special "number" (a moniker)
 * to display for the episode in a podcast player app UI.
 */
export type Phase2EpisodeNumber = {
  number: number;
  display?: string;
};

export const episode: ItemUpdate = {
  phase: 2,
  tag: "podcast:episode",
  name: "episode",
  nodeTransform: firstIfArray,
  supportCheck: (node) => Boolean(getNumber(node)),

  fn(node) {
    const itemUpdate = {
      podcastEpisode: {
        number: getNumber(node),
      } as Phase2EpisodeNumber,
    };

    const display = getAttribute(node, "display");
    if (display) {
      itemUpdate.podcastEpisode.display = display;
    }

    return itemUpdate;
  },
};
