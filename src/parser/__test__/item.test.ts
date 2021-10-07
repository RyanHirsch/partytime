import { parseFeed } from "../index";
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
      expect(first).not.toHaveProperty("itunesEpisode");
      expect(first).toHaveProperty("itunesEpisodeType", "");
      expect(first).toHaveProperty("itunesSeason", 0);
      expect(first).toHaveProperty("explicit", false);
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
});
