/* eslint-disable sonarjs/no-duplicate-string */
import { parseFeed } from "../index";
import { ItunesEpisodeType } from "../shared";
import * as helpers from "./helpers";

describe("item handling", () => {
  let feed: string;
  beforeAll(async () => {
    feed = await helpers.loadFixture("empty");
  });
  describe("valid items", () => {
    it("handles no items", () => {
      const xml = feed;

      const result = parseFeed(xml);

      expect(result.items).toHaveLength(0);
    });

    it("handles one item", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
      `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(result.items).toHaveLength(1);
      expect(first).toHaveProperty("author", "");
      expect(first).toHaveProperty("title", "");
      expect(first).toHaveProperty("link", "");
      expect(first).toHaveProperty("itunesImage", "");
      expect(first).toHaveProperty("duration", 0);
      expect(first).toHaveProperty("explicit", false);
      expect(first).not.toHaveProperty("itunesEpisode");
      expect(first).not.toHaveProperty("itunesEpisodeType");
      expect(first).not.toHaveProperty("itunesSeason");
      expect(first).not.toHaveProperty("keywords");
      expect(first).not.toHaveProperty("pubDate");
    });

    it("handles invalid item (missing guid)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
      `
      );

      const result = parseFeed(xml);

      expect(result.items).toHaveLength(0);
    });

    it("handles invalid item (missing enclosure)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
        </item>
      `
      );

      const result = parseFeed(xml);

      expect(result.items).toHaveLength(0);
    });
  });

  describe("title", () => {
    it("extracts title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <title>Test 123</title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <title>Test 123</title>
          <title>Test 345</title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <title></title>
          <title>Test 345</title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", "Test 345");
    });

    it("sanitizes new lines ", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <title>Test
           123</title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", "Test 123");
    });

    it("falls back to itunes:title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:title>Test 345</itunes:title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", "Test 345");
    });

    it.skip("sanitizes smart quotes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <title>“The AP Bows to the Right-Wing Mob.”</title>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("title", '"The AP Bows to the Right-Wing Mob."');
    });
  });

  describe("author", () => {
    it("extracts author node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <author>Jim</author>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("author", "Jim");
    });

    it("falls back to itunes:author node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:author>Bob</itunes:author>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("author", "Bob");
    });

    it("prioritizes author node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <author>Jeremy</author>
          <itunes:author>Bob</itunes:author>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("author", "Jeremy");
    });
  });

  describe("link", () => {
    it("extracts link node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <link>https://twit.tv/shows/this-week-in-tech/episodes/842</link>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("link", "https://twit.tv/shows/this-week-in-tech/episodes/842");
    });

    it("extracts link href text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <link href="http://1387.noagendanotes.com"></link>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("link", "http://1387.noagendanotes.com");
    });

    it("prioritizes link node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <link href="http://1387.noagendanotes.com">something</link>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("link", "something");
    });
  });

  describe("itunes image", () => {
    it.todo("Test multiple image nodes");
    it("extracts node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:image>asfd</itunes:image>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesImage", "asfd");
    });

    it("extracts href text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:image href="sdgf"></itunes:image>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesImage", "sdgf");
    });

    it("prioritizes node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:image href="bbb">aaa</itunes:image>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesImage", "aaa");
    });

    it("falls back to a nested url text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:image><url>ccc</url></itunes:image>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesImage", "ccc");
    });

    it.todo("sanitizes the url (non-latin characters)");

    it("sanitizes the url (max length)", () => {
      const example = Array.from({ length: 769 }, () => "a").join("");
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:image><url>${example}</url></itunes:image>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(example).toHaveLength(769);
      expect(first.itunesImage).toHaveLength(768);
    });
  });

  describe("duration", () => {
    it("extracts node text to seconds (0)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:duration>0</itunes:duration>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("duration", 0);
    });

    it("extracts node text to seconds (30)", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:duration>30</itunes:duration>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("duration", 30);
    });

    it("converts MM:SS to seconds", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:duration>1:30</itunes:duration>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("duration", 90);
    });

    it("defaults bad input to 30 minutes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:duration>aa</itunes:duration>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("duration", 1800);
    });
  });

  describe("itunesEpisode", () => {
    it("extracts node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episode>1</itunes:episode>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisode", 1);
    });

    it("handles non-digits preceeding the number", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episode>adf1</itunes:episode>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisode", 1);
    });

    it("handles non-digits proceeding the number", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episode>1asdf</itunes:episode>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisode", 1);
    });
  });

  describe("itunesSeason", () => {
    it("extracts node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:season>1</itunes:season>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesSeason", 1);
    });

    it("handles non-digits preceeding the number", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:season>adf1</itunes:season>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesSeason", 1);
    });

    it("handles non-digits proceeding the number", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:season>1asdf</itunes:season>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesSeason", 1);
    });
  });

  describe("itunesEpisodeType", () => {
    it("matches full", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episodeType>full</itunes:episodeType>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisodeType", ItunesEpisodeType.Full);
    });

    it("does case-insenstive matches", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episodeType>fuLL</itunes:episodeType>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisodeType", ItunesEpisodeType.Full);
    });

    it("matches trailer", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episodeType>trailer</itunes:episodeType>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisodeType", ItunesEpisodeType.Trailer);
    });

    it("matches bonus", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:episodeType>bonus</itunes:episodeType>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("itunesEpisodeType", ItunesEpisodeType.Bonus);
    });
  });

  describe("explicit", () => {
    it("matches true", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:explicit>true</itunes:explicit>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("explicit", true);
    });

    it("matches Yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:explicit>Yes</itunes:explicit>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("explicit", true);
    });

    it("matches No", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:explicit>No</itunes:explicit>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("explicit", false);
    });
  });

  describe("enclosure", () => {
    it("extracts all expected values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 76606111,
          type: "audio/mpeg",
        })
      );
    });

    it("skips invalid enclosure nodes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure>Test</enclosure>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 76606111,
          type: "audio/mpeg",
        })
      );
    });

    it("skips invalid enclosure nodes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure length="76606111" type="audio/mpeg"/>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 76606111,
          type: "audio/mpeg",
        })
      );
    });

    it("skips empty enclosure nodes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure />
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" length="76606111" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 76606111,
          type: "audio/mpeg",
        })
      );
    });

    it("defaults length to 0", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 0,
          type: "audio/mpeg",
        })
      );
    });

    it("infers media type based on the enclosure", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3" />
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url: "https://mp3s.nashownotes.com/PC20-17-2020-12-25-Final.mp3",
          length: 0,
          type: "audio/mpeg",
        })
      );
    });

    it("handles query strings for type inference", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://pdst.fm/e/chtbl.com/track/479722/traffic.megaphone.fm/DGT9649255632.mp3?updated=1631664875" />
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.enclosure).toEqual(
        expect.objectContaining({
          url:
            "https://pdst.fm/e/chtbl.com/track/479722/traffic.megaphone.fm/DGT9649255632.mp3?updated=1631664875",
          length: 0,
          type: "audio/mpeg",
        })
      );
    });
  });

  describe("keywords", () => {
    it("extracts itunes keywords", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:keywords>Indie, Indie App, App, Indie Developer, Developer, iOS, Swift, SwiftUI</itunes:keywords>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.keywords).toEqual(
        expect.arrayContaining([
          "Indie",
          "Indie App",
          "App",
          "Indie Developer",
          "Developer",
          "iOS",
          "Swift",
          "SwiftUI",
        ])
      );
    });

    it("ignores empty value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:keywords></itunes:keywords>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).not.toHaveProperty("keywords");
    });

    it("ignores empty values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:keywords>Indie,,</itunes:keywords>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.keywords).toEqual(expect.arrayContaining(["Indie"]));
    });

    it("ignores sanitizes spacing", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <itunes:keywords>Indie     Developer,,</itunes:keywords>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first.keywords).toEqual(expect.arrayContaining(["Indie Developer"]));
    });
  });

  describe("guid", () => {
    it("extracts from a text node", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("guid", "https://example.com/ep0003");
    });

    it("extracts a CDATA wrapped value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <guid isPermaLink="false">
          <![CDATA[ b041c394-4ed9-11eb-aeb1-5ba5c22318e1 ]]>
          </guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("guid", "b041c394-4ed9-11eb-aeb1-5ba5c22318e1");
    });
  });

  describe("pubdate", () => {
    it("extracts the publish date value and produces a Date", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>Thu, 30 Sep 2021 21:19:00 -0000</pubDate>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("pubDate", new Date("Thu, 30 Sep 2021 21:19:00 -0000"));
    });

    it("handles seconds since epoch", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>1633704259</pubDate>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("pubDate", new Date(1633704259 * 1000));
    });

    it("handles milliseconds since epoch", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>1633704259000</pubDate>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).toHaveProperty("pubDate", new Date(1633704259 * 1000));
    });

    it("handles bad values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>eleven</pubDate>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        `
      );

      const result = parseFeed(xml);
      const [first] = result.items;

      expect(first).not.toHaveProperty("pubDate");
    });
  });
});
