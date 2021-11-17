/* eslint-disable sonarjs/no-duplicate-string */
import { parseFeed } from "../../index";
import * as helpers from "../../__test__/helpers";

describe("atom namespace", () => {
  const feed = `
  <?xml version="1.0" encoding="UTF-8"?>
  <rss
    xmlns:adam="http://www.w3.org/2005/Atom"
    version="2.0">
      <channel>
      </channel>
  </rss>
`;

  describe("pubsub", () => {
    it("extracts the self url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <adam:link href="https://feeds.megaphone.fm/pod-save-america" rel="" type="application/rss+xml"/>
        <adam:link href="" rel="self" type="application/rss+xml"/>
        <adam:link href="https://feeds.megaphone.fm/pod-save-america" rel="self" type="application/rss+xml"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty("self", "https://feeds.megaphone.fm/pod-save-america");
    });

    it("extracts the next url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <adam:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
    });

    it("extracts multiple types", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <adam:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss" rel="self" type="application/rss+xml"/>
        <adam:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "self",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss"
      );
    });

    it("extracts the hub url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <adam:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml"/>
        <adam:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });

    it("extracts the hub url with inline atom namespace (plain link last)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml" xmlns="http://www.w3.org/2005/Atom" />
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml" xmlns="http://www.w3.org/2005/Atom"/>
        <link>https://some-url-here</link>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("link", "https://some-url-here");
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });

    it("extracts the hub url with inline atom namespace (plain link first)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <link>https://some-url-here</link>
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml" xmlns="http://www.w3.org/2005/Atom" />
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml" xmlns="http://www.w3.org/2005/Atom"/>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("link", "https://some-url-here");
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });

    it("handles mixed links", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss" rel="self" type="application/rss+xml"/>
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss" rel="hub" type="application/rss+xml"/>
        <link href="https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206" rel="next" type="application/rss+xml"/>        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubsub");
      expect(result.pubsub).toHaveProperty(
        "self",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss"
      );
      expect(result.pubsub).toHaveProperty(
        "next",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/sounds.rss?before=267424206"
      );
      expect(result.pubsub).toHaveProperty(
        "hub",
        "https://feeds.soundcloud.com/users/soundcloud:users:220400255/lies.rss"
      );
    });
  });
});
