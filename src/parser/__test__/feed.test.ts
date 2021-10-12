/* eslint-disable sonarjs/no-duplicate-string */
import { parseFeed } from "../index";
import * as helpers from "./helpers";

describe("feed handling", () => {
  const feed = `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
        <channel>
        </channel>
    </rss>
`;

  describe("title", () => {
    it("extracts title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test 123</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test 123</title>
          <title>Test 345</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });

    it("extracts first title node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title></title>
          <title>Test 345</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 345");
    });

    it("sanitizes new lines ", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <title>Test
           123</title>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", "Test 123");
    });
  });

  describe("link", () => {
    it("extracts link node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link>https://some-url-here</link>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://some-url-here");
    });

    it("extracts link href text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link href="https://some-other-url-here" />
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://some-other-url-here");
    });

    it("uses url node as last resort", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <link />
          <url>https://final-fallback</url>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("link", "https://final-fallback");
    });
  });

  describe("description", () => {
    it("extracts the value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <description>hey   there</description>
          <description>hello</description>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "hey there");
    });

    it("falls back to itunes:summary value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:summary>
          <![CDATA[ <p>bye</p> ]]>
          </itunes:summary>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "<p>bye</p>");
    });

    it("prefers description value when the fall back exists", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <description>hello</description>
          <itunes:summary>
          <![CDATA[ <p>bye</p> ]]>
          </itunes:summary>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("description", "hello");
    });
  });

  describe("language", () => {
    it("extracts language node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <language>en-US</language>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("language", "en-US");
    });
  });

  describe("explicit", () => {
    it("matches true", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>true</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", true);
    });

    it("matches Yes", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>Yes</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", true);
    });

    it("matches No", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
          <itunes:explicit>No</itunes:explicit>
        `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("explicit", false);
    });
  });

  describe("itunesImage", () => {
    it("extracts the url text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image>
              <url>https://some-great-url</url>
            </itunes:image>
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "https://some-great-url");
    });

    it("extracts the url text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image href="https://an-href" />
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "https://an-href");
    });

    it("extracts the node text value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
            <itunes:image>http://here-we-go</itunes:image>
          `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesImage", "http://here-we-go");
    });
  });

  describe("itunesCategory", () => {
    it("extracts a single category", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Technology"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["technology"]);
    });

    it("extracts a heirarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="News">
          <itunes:category text="Tech News"/>
        </itunes:category>
        <itunes:category text="Technology"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["news", "news > tech news", "technology"]);
    });

    it("extracts multiple non-herarchical categories", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <itunes:category text="Business"/>
        <itunes:category text="News"/>
      `
      );

      const result = parseFeed(xml);

      expect(result).toHaveProperty("itunesCategory", ["business", "news"]);
    });
  });

  describe("generator", () => {
    it("extracts the node value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <generator>NPR API RSS Generator 0.94</generator>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("generator", "NPR API RSS Generator 0.94");
    });
  });

  describe("pubDate", () => {
    it("extracts the node value and converts to a date", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <pubDate>Tue, 18 May 2021 13:49:20 -0000</pubDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Tue, 18 May 2021 13:49:20 -0000"));
    });

    it("ignores bad values", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <pubDate>Yesteryear</pubDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).not.toHaveProperty("pubDate");
    });

    it("falls back to lastBuildDate", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <lastBuildDate>Sun, 10 Oct 2021 23:02:57 PDT</lastBuildDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("Sun, 10 Oct 2021 23:02:57 PDT"));
    });

    // TODO
    it.skip("falls back to newest item pubdate", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <item>
          <pubDate>Thu, 30 Sep 2021 21:19:00 -0000</pubDate>
          <description>hello</description>
          <guid isPermaLink="true">https://example.com/ep0003</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1-13845dce07dd/d11384ea-69b5-4e33-bd0e-5d33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        <item>
          <pubDate>1 Oct 2021 21:19:00 -0000</pubDate>
          <description>hello again</description>
          <guid isPermaLink="true">https://example.com/ep0005</guid>
          <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5-59b2-4e30-82d1/d11384ea-69b5-4e33-bd0e-6b33fdba8a0d.mp3" length="78034115" type="audio/mpeg"/>
        </item>
        <item>
        <pubDate>Wed, 29 Sept 2021 21:19:00 -0000</pubDate>
        <description>hello 2</description>
        <guid isPermaLink="true">https://example.com/ep0002</guid>
        <enclosure url="https://aphid.fireside.fm/d/1437767933/65632ad5.mp3" length="78034115" type="audio/mpeg"/>
      </item>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("pubDate", new Date("1 Oct 2021 21:19:00 -0000"));
    });
  });

  describe("lastBuildDate", () => {
    it("extracts node value", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <lastBuildDate>Sun, 10 Oct 2021 23:02:57 PDT</lastBuildDate>
        `
      );

      const result = parseFeed(xml);
      expect(result).toHaveProperty("lastBuildDate", new Date("Sun, 10 Oct 2021 23:02:57 PDT"));
    });
  });
});
